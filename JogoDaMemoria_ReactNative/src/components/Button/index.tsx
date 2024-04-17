import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import React from 'react';

export interface ButtonProps {
    text: string;
    onClick: () => void;
    disabled: boolean;
}
const Button: React.FC<ButtonProps> = ({
    text,
    onClick,
    disabled
}) => {

    const buttonStyles = StyleSheet.create({
        buttonEnabled: {
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "gray",
            width: "100%",
            padding: 6,
            borderWidth:1,
            borderColor: "#c3c3c3"
        },
        buttonDisabled: {
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#c3c3c3",
            width: "100%",
            padding: 6,
            borderWidth:1,
            borderColor: "black"
        }
    });

    const onPressHandler = ():void =>{
        onClick();
    }

    return (
        <TouchableOpacity
            style={disabled
                ?
                    buttonStyles.buttonDisabled
                :
                    buttonStyles.buttonEnabled
                }
            onPress={onPressHandler}
            disabled={disabled}
        >
            <Text style={[styles.buttonText, {color: "white"}]}>
                {text}
            </Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    buttonText: {
        borderRadius: 6,
        textAlign: "center"
    },
})

export default Button;