
import React, { Component } from 'react';
import {View, Image, Text, StatusBar, TouchableOpacity, BackHandler, Platform} from 'react-native';
import { withNavigation } from 'react-navigation';
import RNExitApp from 'react-native-exit-app';
import { colorYellow } from '../Constants/colors';

class AfterSplashScreen extends Component {
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
        if (Platform.OS == 'android')
            BackHandler.exitApp();
        else
            RNExitApp.exitApp();
    }

    render() {
        return (
            <View style = {styles.container}>
               
                <StatusBar barStyle='light-content' backgroundColor='#000000' />

                <Image 
                    style ={{width: 250, height: 250}} 
                    source= {require('../images/harfa_logo.png')}/>

                <TouchableOpacity style = {styles.buttonContainer} 
                    onPress ={() => this.props.navigation.navigate("AccountType")}>
                    <Text style={styles.text}>
                        CLIENT 
                    </Text>
                </TouchableOpacity>
              
              <TouchableOpacity style = {styles.buttonContainer}
                    onPress={() => this.props.navigation.navigate("ProAccountType")}>
                    <Text style={styles.text}>
                    PRESTATAIRE
                    </Text>
              </TouchableOpacity>
               
           </View>
        )
    }
}

export default withNavigation(AfterSplashScreen);

const styles = {
    container: {
        flex : 1,
        backgroundColor : '#000000',
        justifyContent : 'center',
        alignItems : 'center'
    },
    buttonContainer : {
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
