import React, { Component } from 'react';
import { View, Text, StatusBar, TouchableOpacity, BackHandler } from 'react-native';
import { colorYellow } from '../Constants/colors';

export default class AccountTypeScreen extends Component {

    componentDidMount(){
        const { navigation } = this.props;
        navigation.addListener('willFocus', async () => {
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    handleBackButtonClick = () => {
        this.props.navigation.goBack();
        return true;
    }

    render() {
        return (
            <View style={styles.container}>

                <StatusBar barStyle='light-content' backgroundColor='#000000' />

                <Text style={{color: 'white', fontSize: 20, marginBottom: 50, fontWeight: 'bold', color: 'white'}}>
                    Sélectionnez votre type de compte 
                </Text>

                <TouchableOpacity style={styles.buttonContainer}
                    onPress={() => this.props.navigation.navigate("FacebookGoogle", {
                        "accountType" : "Individual"})}>
                    <Text style={styles.text}>
                        INDIVIDUEL
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonContainer}
                    onPress={() => this.props.navigation.navigate("FacebookGoogle", {
                        "accountType" : "Company"})}>
                    <Text style={styles.text}>
                        ENTREPRISE
                    </Text>
                </TouchableOpacity>

            </View>
        )
    }
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonContainer: {
        width: 250,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        borderColor: colorYellow,
        borderWidth: 2,
        marginBottom: 25,
        textAlign: 'center',
        justifyContent: 'center',
    },
    text: {
        color: 'white',
        textAlign: 'center',
        justifyContent: 'center',
    }
}
