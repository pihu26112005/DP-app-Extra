import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, Text, View } from 'react-native';
import 'nativewind'; // Ensure this import is present
import { Link, Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../constants'
import CustomButton from '../components/CustomButton';
import { useGlobalContext } from '../context/GlobalProvider';

export default function App() {

  const {isLoading, isLoggedin} = useGlobalContext();
  if(!isLoading && isLoggedin){
    <Redirect href="/home" />;
  }

  return (
    // <View style={styles.container}>

    <SafeAreaView className='h-full bg-primary items-center justify-center'>
      <ScrollView contentContainerStyle={{height:'100%'}}>
        <View className='w-full min-h-[85vh] justify-center items-center px-4'>
          <View >
            <Text className='text-white text-3xl text-center '>Welcome back To our platform {' '}</Text>
            <Text className='text-blue-1 text-center text-3xl'>Sora</Text>
          </View>
          <CustomButton 
          title="Continue with email"
          handlePress={()=>{router.push('/sign-in')}}
          customStyle='mt-8 w-full' />
        </View>
      </ScrollView>

      <StatusBar backgroundColor='#161622' style="light" />
    </SafeAreaView>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });
