import React, { Component } from 'react';
import { StyleSheet, Text, ActivityIndicator, View } from 'react-native';
import CardView from 'react-native-cardview';
import { white } from '../Constants/colors';

export default class WaitingDialog extends Component {
    render() {
        return (
            <View style={styles.contentContainer}>
                <CardView style={styles.modal}
                    cardElevation={5}
                    cardMaxElevation={5}
                    cornerRadius={2}>
                    <ActivityIndicator
                        style={{ height: 50 }}
                        color="#C00"
                        size="large" />
                    <Text style={{ padding: 5, fontSize: 10, fontWeight: 'bold' }}>Loading...</Text>
                </CardView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modal: {
        width: 90,
        height: 90,
        padding: 10,
        flexDirection: 'column',
        alignSelf: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: white,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
});