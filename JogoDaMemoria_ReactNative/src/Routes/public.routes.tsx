import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/Home';
import GameStartConfig from '../screens/GameStartConfig';
const Stack = createNativeStackNavigator();


export function PublicRoutes() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="GameStartConfig" component={GameStartConfig} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}