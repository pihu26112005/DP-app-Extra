import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'

const CustomButton = ({title, isLoading, handlePress, customStyle}) => {
  return (
      <TouchableOpacity onPress={handlePress} className={`bg-blue-1 ${isLoading && 'opacity-20'} items-center justify-center h-14 rounded-xl ${customStyle} `} disabled={isLoading} >
        <Text className="text-primary font-psemibold text-lg">
            {title}
        </Text>
      </TouchableOpacity>
  )
}

export default CustomButton