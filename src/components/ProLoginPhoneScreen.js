import React, {Component} from 'react';
import {View,StatusBar, Text, StyleSheet, TextInput, Image, TouchableOpacity, 
    ScrollView, Dimensions, ActivityIndicator} from 'react-native';
import ShakingText from 'react-native-shaking-text';
import { colorYellow } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;

const OTP_VERIFICATION = "https://2factor.in/API/V1/72ba25b6-ee55-11e9-b828-0200cd936042/SMS/"

export default class ProLoginPhoneScreen extends Component{

    constructor(props) {
        super();
        this.state = {
            phone: '',
            error: '',
            opacity: 1,
            isLoading: false,
        }
    }   

    checkValidation = () =>
    {
        if(this.state.phone == '')
        {
          this.setState({error:'Please enter phone number'})
        }
        else
        {
            this.props.navigation.navigate("ProVerification",{
                'mobile': this.state.phone,
                'otp': ""+OTP
            })
        //    this.OTPVerificationTask();
        }
    }

    OTPVerificationTask = () => {

        this.setState({
            isLoading: true,
        })

        var OTP = Math.floor(1000 + Math.random() * 9000);  //Generate 4 Digits number

        fetch(OTP_VERIFICATION+this.state.phone+'/'+OTP, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
         })
         .then((response) => response.json())
         .then((responseJson) => {
            console.log("Response OTPVerificationTask >>"+JSON.stringify(responseJson));
            this.setState({
                isLoading: false,
            })
            if(responseJson.Status == "Success")
            {
                this.props.navigation.navigate("ProVerification",{
                    'mobile': this.state.phone,
                    'otp': ""+OTP
                })
            }
            else
            {
                this.setState({
                    isLoading: false,
                    error: responseJson.Details,
                })
            }
         })
        .catch((error) => {
            this.setState({
                isLoading: false
            })
            alert("Error "+error);
            console.log(JSON.stringify(responseJson));
        });
    }
    
    render(){
        return(
            <View style = {styles.container}>
                
                <StatusBar barStyle='light-content' backgroundColor='#C5940E' />

                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center',
                            alwaysBounceVertical: true}}
                            keyboardShouldPersistTaps='always'>
                       <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <View style={{ flex: 0.35, width: screenWidth, backgroundColor: colorYellow, justifyContent: 'center', alignItems: 'center'}}>
                                
                                <TouchableOpacity style ={{width: 20, height: 20, alignSelf: 'flex-start', marginLeft: 15}}
                                    onPress={() => this.props.navigation.goBack()}>
                                    <Image  style ={{width: 20, height: 20}}
                                        source={require('../icons/arrow_back.png')}/>
                               </TouchableOpacity>
                                
                                <Image 
                                    style ={{width: 170, height: 170}} 
                                    source={require('../images/harfa_logo.png')}/>
                            </View>

                            <View style={styles.logincontainer}>

                                <View>
                                    <Text style={{color: colorYellow, fontSize: 18, fontWeight: 'bold', alignItems: 'center', justifyContent: 'center'}}>
                                        Enter your phone number
                                    </Text>
                                </View>

                                <View>
                                    <Text style={{fontSize: 12, alignItems: 'center', justifyContent: 'center', 
                                        textAlign: 'center', marginLeft: 30, marginRight: 30, marginTop: 10, marginBottom: 40}}>
                                        Make sure you can receive SMS to this number so that we can send a code
                                    </Text>
                                </View>
                           
                                <ShakingText style={{color: 'red', fontWeight: 'bold', margin: 15}}>
                                    {this.state.error}
                                </ShakingText>

                                <View style={styles.textInputView}>
                                    <Image style={{ width: 15, height: 15, marginLeft: 20 }}
                                        source={require('../icons/mobile.png')}></Image>
                                    <TextInput 
                                        style={{ width: screenWidth-85, height: 50, color: 'black', fontSize: 14, marginLeft: 10}}
                                        placeholder='Phone number'
                                        keyboardType='numeric'
                                        onChangeText={ (phoneInput) => this.setState({error:'', phone: phoneInput})}>
                                    </TextInput>
                                </View>

                                <TouchableOpacity style = {styles.buttonContainer}
                                    onPress={this.checkValidation}>
                                    <Text style={styles.text}>
                                        Continue
                                    </Text>
                                </TouchableOpacity>   
                            </View>     
                      </View>
                </ScrollView>

                <View style={styles.loaderStyle}>
                    {this.state.isLoading && (
                        <ActivityIndicator
                            style={{ height: 80 }}
                            color="#C00"
                            size="large" />
                    )}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent : 'center',
        alignItems: 'center',  
        backgroundColor: "#E8EEE9" 
     },
    logincontainer: {
        flex: .65,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    textInputView: {
        flexDirection: 'row', 
        width: screenWidth - 40, 
        height: 45, 
        justifyContent: 'center',
        alignItems: 'center', 
        borderRadius: 5, 
        backgroundColor: 'white', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 }, 
        shadowOpacity: 0.75, 
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 10
    },
    separator:{
        borderBottomWidth: 0.8,
        borderBottomColor: '#ebebeb',
        marginTop: 5,
        marginBottom: 5
    },
    buttonContainer : {
        width: 200,
        paddingTop: 10,
        backgroundColor: '#000000',
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        borderColor: colorYellow,
        borderWidth: 2,
        marginBottom: 25,
        textAlign: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    text: {
        fontSize: 16,
        color: 'white',
        textAlign: 'center',
        justifyContent: 'center',
    },
    loaderStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    },
});

