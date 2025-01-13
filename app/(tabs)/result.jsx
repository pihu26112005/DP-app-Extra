import { LineChart } from 'react-native-chart-kit';

import { Client, Account, Storage, ID, Models } from 'react-native-appwrite';
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from "react-native";
import { getDownloadURL, ref } from "firebase/storage";
import { icons } from "../../constants";
import { createVideoPost } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('671f94c1001f0c9a88a1');

const account = new Account(client);
const storage = new Storage(client);

const CreateResultUI = () => {
  const [files, setFiles] = useState([]);
  const [minErrorFile, setMinErrorFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [uploadFileData, setUploadFileData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    document: null, // State for the selected document
  });

  const { user } = useGlobalContext();

  // Fetch all files from Appwrite Storage
  const fetchAllFiles = async () => {
    try {
      const response = await storage.listFiles('671fa00f0021cb655fbd');
      const files = response.files;
  
      const fileDataPromises = files.map(async (file) => {
        const fileUrl = await storage.getFileView('671fa00f0021cb655fbd', file.$id);
        const fileResponse = await fetch(fileUrl);
  
        if (fileResponse.ok) {
          const fileContent = await fileResponse.text();
  
          // Split file content into lines and find where the data begins
          const lines = fileContent.split('\n').filter(line => line.trim() !== '');
          const dataStartIndex = lines.findIndex(line => line.startsWith("BEGIN CH1_DATA")) + 1;
  
          // Extract frequencies and values
          const freq = [];
          const values = [];
  
          for (let i = dataStartIndex; i < lines.length; i++) {
            const line = lines[i].trim();
  
            // Break if reaching the end of the data block
            if (!line || line.startsWith('!') || line.startsWith('END')) break;
  
            const [frequency, val1, val2, val3, val4] = line.split(',').map(parseFloat);
  
            // Validate the parsed values
            if (!isNaN(frequency) && [val1, val2, val3, val4].every(val => !isNaN(val))) {
              freq.push(frequency);
              values.push([val1, val2, val3, val4]);
            } else {
              console.log(`Skipping invalid line: ${line}`);
            }
          }
  
          return { filename: file.name, freq, values };
        } else {
          throw new Error(`Failed to fetch file content for ${file.name}`);
        }
      });
  
      const allFileData = await Promise.all(fileDataPromises);
      setFileData(allFileData);
      // console.log(allFileData[0]); // Debugging: log the structured data
    } catch (error) {
      console.error("Error fetching files:", error);
      Alert.alert("Error", "Failed to fetch files from Appwrite storage");
    }
  };
  

  useEffect(() => {
    fetchAllFiles();
  }, []);



  const openPicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["text/plain"], // Only allow .txt files for document selection
    });

    if (!result.canceled) {
      setForm({
        ...form,
        document: result,
      });
    }
  };


  const uploadFile = async () => {
    if (!form.document) {
      Alert.alert("Please upload a file to compare.");
      return;
    }
  
    setUploading(true);
  
    try {
      const { mimeType, ...rest } = form.document.assets[0];
      const asset = { type: mimeType, ...rest };
  
      // Upload the file to Appwrite storage
      const uploadResponse = await storage.createFile('678556be0035ff1d0135', ID.unique(), asset);
  
      // Fetch the uploaded file content
      const fileUrl = await storage.getFileView('678556be0035ff1d0135', uploadResponse.$id);
      const fileResponse = await fetch(fileUrl);
  
      if (fileResponse.ok) {
        const fileContent = await fileResponse.text();
  
        // Split file content into lines and find where the data begins
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        const dataStartIndex = lines.findIndex(line => line.startsWith("BEGIN CH1_DATA")) + 1;
  
        // Extract frequencies and values
        const frequencies = [];
        const values = [];
  
        for (let i = dataStartIndex; i < lines.length; i++) {
          const line = lines[i].trim();
  
          // Break if reaching the end of the data block
          if (!line || line.startsWith('!') || line.startsWith('END')) break;
  
          const [frequency, val1, val2, val3, val4] = line.split(',').map(parseFloat);
  
          // Validate the parsed values
          if (!isNaN(frequency) && [val1, val2, val3, val4].every(val => !isNaN(val))) {
            frequencies.push(frequency);
            values.push([val1, val2, val3, val4]);
          } else {
            console.log(`Skipping invalid line: ${line}`);
          }
        }
  
        const uploadFileData = { filename: uploadResponse.name, frequencies, values };
        setUploadFileData(uploadFileData);
  
        Alert.alert("Success", "File uploaded and processed successfully.");
      } else {
        throw new Error(`Failed to fetch file content for ${uploadResponse.name}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Error", "Failed to upload file to Appwrite storage.");
    } finally {
      setUploading(false);
    }
  };
  


  const calculateMSE = (values1, values2) => {
    if (values1.length !== values2.length) {
      throw new Error("Arrays must have the same length to calculate MSE.");
    }
  
    let totalSquaredError = 0;
    let totalElements = 0;
  
    for (let i = 0; i < values1.length; i++) {
      if (values1[i].length !== values2[i].length) {
        throw new Error(`Mismatch in sub-array lengths at index ${i}`);
      }
  
      for (let j = 0; j < values1[i].length; j++) {
        const diff = values1[i][j] - values2[i][j];
        totalSquaredError += diff * diff;
        totalElements++;
      }
    }
    console.log("Total Squared Error:", totalSquaredError);
    console.log("Total Elements:", totalElements);
  
    return totalSquaredError / totalElements;
  };
  

  const findFileWithMinimumError = () => {
    if (!uploadFileData || !fileData || fileData.length === 0) {
      console.error("No data available for comparison.");
      return;
    }
    console.log("Comparing uploaded file with all files...");
    console.log("Uploaded file:", uploadFileData.filename);
    console.log("Number of files to compare:", fileData.length);
    console.log("............................................................................................................................")
    console.log(fileData[0].values);
    console.log("............................................................................................................................")
  
    let minError = Infinity;
    let minErrorFile = null;
  
    fileData.forEach(file => {
      try {
        const mse = calculateMSE(uploadFileData.values, file.values);
        if (mse < minError) {
          minError = mse;
          minErrorFile = file.filename;
          setMinErrorFile(file);
        }
        // console.log(`MSE for file ${file.filename}:`, mse);
      } catch (error) {
        console.error(`Error calculating MSE for file ${file.filename}:`, error);
      }
    });
  
    if (minErrorFile) {
      console.log(`File with minimum error: ${minErrorFile}`);
    } else {
      console.log("No file found with minimum error.");
    }
  };
  

  // Example usage after uploading a file and fetching all files
  useEffect(() => {
    if (uploadFileData && fileData) {
      findFileWithMinimumError();
    }
  }, [uploadFileData, fileData]);


  const extractDosageFromFilename = (filename) => {
    const match = filename.match(/(\d+)mg/);
    return match ? parseInt(match[1], 10) : null;
  };


  // useEffect(() => {
  //   if ( fileData) {
  //     console.log(fileData[0]);
  //   }
  // }, [fileData]);



  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">

        <View className="mt-7 space-y-2">
          <Text className="text-base text-gray-100 font-pmedium">
            Upload Document
          </Text>

          <TouchableOpacity onPress={openPicker}>
            {/* {form.document ? (
              <Text className="text-base text-gray-100 font-pmedium">
                {form.document.name}
              </Text>
            ) : ( */}
            <View className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 flex justify-center items-center flex-row space-x-2">
              <Image
                source={icons.upload}
                resizeMode="contain"
                alt="upload"
                className="w-5 h-5"
              />
              <Text className="text-sm text-gray-100 font-pmedium">
                Choose a file
              </Text>
            </View>
            {/* )} */}
          </TouchableOpacity>
        </View>

        <CustomButton
          title="Compare Files"
          handlePress={uploadFile}
          customStyle="mt-7"
          isLoading={uploading}
        />

        <View className="mt-14 mb-7 space-y-2">
          <Text className="text-base text-center text-gray-100 font-pmedium">
            Result will be displayed here
          </Text>

          <View className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 flex justify-center items-center flex-row space-x-2">
            <Image
              source={icons.file}
              resizeMode="contain"
              alt="file"
              className="w-5 h-5"
            />
            <Text className="text-sm text-gray-100 font-pmedium">
              {minErrorFile ? extractDosageFromFilename(minErrorFile.filename) : "N/A"}
            </Text>
          </View>
        </View>

        {/* {minErrorFile && (
          <View className="mt-4">
          <Text className="text-lg text-white font-psemibold text-center">
            Frequency vs Values
          </Text>
          
          <LineChart
            data={{
              labels: minErrorFile.frequencies.splice(2).map(f => f.toFixed(2)),
              datasets: [
                {
                  data: minErrorFile.values.splice(2),
                },
              ],
            }}
            width={Dimensions.get('window').width - 32} // from react-native
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#000',
              backgroundGradientFrom: '#000',
              backgroundGradientTo: '#000',
              decimalPlaces: 2, // optional, defaults to 2dp
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
        )} */} 

        { minErrorFile && (
          <View className="mt-4 ">
          {extractDosageFromFilename(minErrorFile.filename) < 180 ? (
            <View className="w-full h-16  rounded-lg border-green-800 border-2 bg-green-500" />
          ) : (
            <View className="w-full h-16  rounded-lg border-red-800 border-2 bg-red-500" />
          )}
        </View>
        )}

        <Text></Text>


      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateResultUI;
