import React, { useState } from 'react';
import { View, Text, TouchableWithoutFeedback, Modal, StyleSheet } from 'react-native';

const DynamicDropdown = () => {
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedValue, setSelectedValue] = useState<number | undefined>(undefined);

    const generateOptions = () => {
        const options = [];
        for (let i = 40; i <= 100; i += 2) {
            options.push(i);
        }
        return options;
    };

    const options = generateOptions();

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    const handleValueSelect = (value: number) => {
        setSelectedValue(value);
        toggleModal();
    };

    return (
        <View style={styles.container}>
            <TouchableWithoutFeedback onPress={toggleModal}>
                <View style={styles.selectedValueContainer}>
                    <Text style={styles.selectedValueText}>
                        {selectedValue !== undefined ? selectedValue.toString() : 'Selecione um valor'}
                    </Text>
                </View>
            </TouchableWithoutFeedback>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.optionsContainer}>
                        {options.map((value) => (
                            <TouchableWithoutFeedback key={value} onPress={() => handleValueSelect(value)}>
                                <View style={styles.optionItem}>
                                    <Text>{value}</Text>
                                </View>
                            </TouchableWithoutFeedback>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedValueContainer: {
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
    },
    selectedValueText: {
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    optionsContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 8,
        width: 200,
    },
    optionItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
});

export default DynamicDropdown;
