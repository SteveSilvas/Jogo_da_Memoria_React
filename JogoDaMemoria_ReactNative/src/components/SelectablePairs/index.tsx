import React, { useState } from 'react';
import { View, Text, TouchableWithoutFeedback, Modal } from 'react-native';

const SelectablePair = () => {
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedValue, setSelectedValue] = useState<number | undefined>(undefined);

    const generateOptions = () => {
        const options = [];
        for (let i = 0; i <= 100; i += 2) {
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TouchableWithoutFeedback onPress={toggleModal}>
                <View style={{ borderWidth: 1, borderColor: 'black', padding: 10 }}>
                    <Text>
                        {selectedValue !== undefined ? selectedValue.toString() : 'Selecione um valor'}
                    </Text>
                </View>
            </TouchableWithoutFeedback>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <View style={{ backgroundColor: 'white', padding: 20 }}>
                        {options.map((value) => (
                            <TouchableWithoutFeedback key={value} onPress={() => handleValueSelect(value)}>
                                <View style={{ paddingVertical: 10 }}>
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

export default SelectablePair;
