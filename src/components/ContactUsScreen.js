import React, { Component } from 'react';
import {View, StyleSheet, Dimensions, Image, Text, TouchableOpacity, Platform, StatusBar, BackHandler} from 'react-native';
import { colorBg, colorPrimaryDark, colorPrimary } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
    return (
        Platform.OS === 'ios' ?
        <View style={{
            width: "100%",
            height: STATUS_BAR_HEIGHT,
            backgroundColor: colorPrimaryDark}}>
            <StatusBar
                barStyle="light-content"/>
        </View>
        :
        <StatusBar barStyle='light-content' backgroundColor={colorPrimaryDark} /> 
    );
}

export default class ContactUsScreen extends Component{
    componentDidMount() {
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

    render(){
        return(
            <View style={styles.container}>

                <StatusBarPlaceHolder/>
               
                <View style={{flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                     paddingLeft: 10, paddingRight: 20, paddingBottom: 5}}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={{ width: 35, height: 35, justifyContent: 'center', }}
                            onPress={() => this.props.navigation.goBack()}>
                            <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                source={require('../icons/arrow_back.png')} />
                        </TouchableOpacity>

                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', alignSelf: 'center', marginLeft: 5 }}>
                            Contactez-nous
                        </Text>
                    </View>
                </View>

                <View style={styles.mainContainer}>

                    <Image style={{width: screenWidth-20, height: 200,}}
                        source={{uri: 'https://cdn.pixabay.com/photo/2017/12/02/14/38/contact-us-2993000_960_720.jpg'}}/>
                    
                    <View style={{ flexDirection: 'row', padding: 10, }}>
                        <Image style={{width: 20, height: 20}}
                            source={require('../icons/email.png')}></Image>
                        <Text style={{marginLeft: 10}}>harfa2020@gmail.com</Text>        
                    </View>

                    <View style={{ flexDirection: 'row', padding: 10, }}>
                        <Image style={{width: 20, height: 20}}
                            source={require('../icons/mobile.png')}></Image>
                        <Text style={{marginLeft: 10}}>Votre numéro de contact</Text>        
                    </View>

                    <View style={{ flexDirection: 'row', padding: 10, }}>
                        <Image style={{width: 20, height: 20}}
                            source={require('../icons/maps_location.png')}></Image>
                        <Text style={{marginLeft: 10}}>Votre adresse de contact</Text>        
                    </View>
               
                </View>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg ,
    },
    mainContainer: {
        backgroundColor: 'white',
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 2,
    }
});