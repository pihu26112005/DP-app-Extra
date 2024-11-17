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
          const fileContent = await fileResponse.text(); // or fileResponse.json() if it's JSON

          // Parse the file content
          const lines = fileContent.split('\n').filter(line => line.trim() !== '');
          const frequencies = [];
          const values = [];
          lines.forEach(line => {
            const [frequency, value] = line.trim().split(/\s+/);
            frequencies.push(parseFloat(frequency));
            values.push(parseFloat(value));
          });

          return { filename: file.name, frequencies, values };
        } else {
          throw new Error(`Failed to fetch file content for ${file.name}`);
        }
      });

      const allFileData = await Promise.all(fileDataPromises);
      setFileData(allFileData);
      // console.log(allFileData);
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

  // const fetchFileFromAppwrite = async (fileId) => {
  //   try {
  //     const response = await storage.getFileView('671fa00f0021cb655fbd', fileId);
  //     const fileUrl = response.href; // Assuming response contains the URL in href property
  //     console.log(fileUrl); // Log the URL to inspect it

  //     const fileResponse = await fetch(fileUrl);
  //     if (fileResponse.ok) {
  //       const fileContent = await fileResponse.text(); // or fileResponse.json() if it's JSON
  //       return fileContent;
  //     } else {
  //       console.error("Failed to fetch file content from URL");
  //       Alert.alert("Error", "Failed to fetch file content from URL");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching file:", error);
  //     Alert.alert("Error", "Failed to fetch file from Appwrite");
  //   }
  // };

  // const compareFiles = async () => {
  //   if (!form.document) {
  //     Alert.alert("Please upload a file to compare.");
  //     return;
  //   }

  //   const uploadedFileContent = await form.document;
  //   if (!uploadedFileContent) {
  //     Alert.alert("Error", "Failed to read the uploaded file content.");
  //     return;
  //   }

  //   const comparisons = await Promise.all(
  //     files.map(async (file) => {
  //       const storedFileContent = await fetchFileFromAppwrite(file.$id);
  //       if (!storedFileContent) return { fileName: file.name, similarity: "N/A" };

  //       // Perform string similarity comparison using string-similarity library
  //       const similarity = stringSimilarity.compareTwoStrings(uploadedFileContent, storedFileContent) * 100;

  //       return { fileName: file.name, similarity: similarity.toFixed(2) };
  //     })
  //   );

  //   Alert.alert("Comparison Results", comparisons.map(({ fileName, similarity }) => `${fileName}: ${similarity}%`).join("\n"));
  // };


  const uploadFile = async () => {
    if (!form.document) {
      Alert.alert("Please upload a file to compare.");
      return;
    }

    setUploading(true);

    try {
      // console.log(form.document, "form.document");
      const { mimeType, ...rest } = form.document.assets[0];
      const asset = { type: mimeType, ...rest };

      // Upload the file to Appwrite storage
      const uploadResponse = await storage.createFile('671fa00f0021cb655fbd', ID.unique(), asset);
      // console.log(uploadResponse, "uploadResponse");

      // Fetch the uploaded file content
      const fileUrl = await storage.getFileView('671fa00f0021cb655fbd', uploadResponse.$id);
      const fileResponse = await fetch(fileUrl);
      if (fileResponse.ok) {
        const fileContent = await fileResponse.text(); // or fileResponse.json() if it's JSON

        // Parse the file content
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        const frequencies = [];
        const values = [];
        lines.forEach(line => {
          const [frequency, value] = line.trim().split(/\s+/);
          frequencies.push(parseFloat(frequency));
          values.push(parseFloat(value));
        });

        const uploadFileData = { filename: uploadResponse.name, frequencies, values };
        setUploadFileData(uploadFileData);
        // console.log(uploadFileData, "uploadFileData");

        Alert.alert("Success", "File uploaded and processed successfully.");
      } else {
        throw new Error(`Failed to fetch file content for ${uploadResponse.name}`);
      }

      // fetchAllFiles();
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

    let sum = 0;
    for (let i = 2; i < values1.length; i++) {
      const diff = values1[i] - values2[i];
      sum += diff * diff;
    }

    return sum / values1.length;
  };

  const findFileWithMinimumError = () => {
    if (!uploadFileData || !fileData || fileData.length === 0) {
      console.error("No data available for comparison.");
      return;
    }

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
