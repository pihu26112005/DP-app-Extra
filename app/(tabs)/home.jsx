import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, FlatList, Image, RefreshControl, Text, View } from "react-native";

import { images } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import SearchInput from "../../components/SearchInput";
import EmptyState from "../../components/EmptyState";
import ModalMade from "../../components/ModalMade";

// Mock Data
const previousScans = [
  {
    id: "1",
    date: "2024-10-20",
    result: "Melamine detected",
    level: "15%",
  },
  {
    id: "2",
    date: "2024-10-18",
    result: "No adulteration",
    level: "N/A",
  },
  {
    id: "3",
    date: "2024-10-15",
    result: "Melamine detected",
    level: "8%",
  },
];

const articles = [
  {
    id: "1",
    title: "How Melamine Contaminates Milk: Risks and Detection",
    content: "Melamine is an industrial compound used in plastics that can make milk appear to have more protein...",
  },
  {
    id: "2",
    title: "Common Adulterants in Dairy: What You Should Know",
    content: "Milk adulteration with compounds like melamine, water, and starch is common. Here's what you should watch out for...",
  },
  {
    id: "3",
    title: "Melamine and Its Health Impact",
    content: "Consuming melamine-contaminated milk can lead to kidney failure and other severe health risks...",
  },
];

const Home = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onModalClose = () => {
    setIsModalVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // You can refetch the real data here
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="bg-primary">
      <FlatList
        data={previousScans}
        className="h-full"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-4 p-4 bg-black-100 rounded-xl">
            <Text className="text-white font-semibold">Scan Date: {item.date}</Text>
            <Text className="text-gray-100 mt-2">Result: {item.result}</Text>
            <Text className="text-gray-100 mt-1">Adulterant Level: {item.level}</Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View className="flex my-6 px-4 space-y-6">
            <View className="flex justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-gray-100">Welcome Back</Text>
                <Text className="text-2xl font-psemibold text-white">Piyush</Text>
              </View>

              <View className="mt-1.5">
                <Image
                  source={images.logoSmall}
                  className="w-9 h-10"
                  resizeMode="contain"
                />
              </View>
            </View>

            <SearchInput />

            {/* Previous Scans Section */}
            <View className="w-full flex-1 pt-5 pb-8">
              <Text className="text-lg font-pregular text-gray-100 mb-3">
                Previous Scans
              </Text>

              <FlatList
                data={previousScans}
                horizontal
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View className="mr-4 p-4 bg-black-100 rounded-xl w-64">
                    <Text className="text-white font-semibold">Scan Date: {item.date}</Text>
                    <Text className="text-gray-100 mt-2">Result: {item.result}</Text>
                    <Text className="text-gray-100 mt-1">Adulterant Level: {item.level}</Text>
                  </View>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>

            {/* Articles Section */}
            <View className="w-full flex-1 pt-5 pb-8">
              <Text className="text-lg font-pregular text-gray-100 mb-3">
                Articles on Milk Adulteration
              </Text>

              <FlatList
                data={articles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View className="mb-4 p-4 bg-black-100 rounded-xl">
                    <Text className="text-white font-semibold">{item.title}</Text>
                    <Text className="text-gray-100 mt-2">{item.content}</Text>
                  </View>
                )}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Scans Found"
            subtitle="You have not performed any scans yet"
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <ModalMade isVisible={isModalVisible} onClose={onModalClose}>
        {/* A list of emoji component will go here */}
      </ModalMade>
    </SafeAreaView>
  );
};

export default Home;
