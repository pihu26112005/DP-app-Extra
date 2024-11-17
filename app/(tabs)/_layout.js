import { View, Text, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { icons } from "../../constants"

const TabIcon = ({ icon, color, focused, name }) => {
  return (
    <View className='items-center justify-center gap-[2px]'>
      <Image source={icon} className='w-6 h-6' tintColor={color} resizeMode='contain' />
      <Text className={`${focused} ? 'font-psemibold' : 'font-pregular' text-xs`} style={{color:color}}>{name}</Text>
    </View>
  )
}

const TabsLayout = () => {
  return (
    <>
      <Tabs 
      // tabBarOptions={{
      //   keyboardHidesTabBar: true
      // }}
      screenOptions={{ 
        headerShown: false, 
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#0CAFFF',
        tabBarInactiveTintColor: '#CDCDE0',
        tabBarStyle:{
          backgroundColor: '#161622',
          height:70,
          borderTopWidth:1,
          borderTopColor:'#161622',
          position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
        } }}>
        <Tabs.Screen
          name="home"
          options={
            {
              title: "Home",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon icon={icons.home} color={color} focused={focused} name="Home" />
              )
            }} />
        <Tabs.Screen
          name="result"
          options={
            {
              title: "Result",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon icon={icons.plus} color={color} focused={focused} name="Result" />
              )
            }} />
            <Tabs.Screen
          name="profile"
          options={
            {
              title: "Profile",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon icon={icons.profile} color={color} focused={focused} name="Profile" />
              )
            }} />
      </Tabs>
    </>
  )
}

export default TabsLayout