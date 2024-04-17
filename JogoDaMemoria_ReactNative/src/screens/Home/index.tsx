import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Button from '../../components/Button';
import { Input } from '../../components/Input/Index';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  GameStartConfig: { playerOne: string; playerTwo: string };
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const Home = () => {
    const [playerOne, setPlayerOne] = useState<string>("");
    const [playerTwo, setPlayerTwo] = useState<string>("");
    const [isPlayersValid, setPlayersValid] = useState<boolean>(false);
    const navigation = useNavigation<HomeScreenNavigationProp>();

    useEffect(() => {
        const isValid = playerOne.trim() !== "" && playerTwo.trim() !== "";
        setPlayersValid(isValid);
    }, [playerOne, playerTwo]);

    const onTestHandler = () => {
        navigation.navigate('GameStartConfig', {
            playerOne,
            playerTwo
        } as { playerOne: string; playerTwo: string });
    };

    return (
        <View style={{ flex: 1, padding: 10, width: "100%", height: "100%", justifyContent: "center", gap: 20 }}>
            <Input
                type='default'
                style={{ width: "100%", padding: 5 }}
                placeholder='Jogador 1'
                value={playerOne}
                onChange={setPlayerOne}
            />
            <Input
                type='default'
                style={{ width: "100%", padding: 5 }}
                placeholder='Jogador 2'
                value={playerTwo}
                onChange={setPlayerTwo}
            />
            <Button
                text='Iniciar Jogo'
                disabled={!isPlayersValid}
                onClick={onTestHandler}
            />
        </View>

    );
};

export default Home;
