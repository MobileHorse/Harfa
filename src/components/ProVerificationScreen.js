
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StatusBar, Text, StyleSheet, TextInput, Image, TouchableOpacity,
    ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import { getPendingJobRequestProvider } from '../Redux/Actions/jobsActions';
import AsyncStorage from '@react-native-community/async-storage';
import ShakingText from 'react-native-shaking-text';
import Config from './Config';
import messaging from '@react-native-firebase/messaging';
import { updateProviderDetails } from '../Redux/Actions/userActions';
import { colorYellow, colorPrimaryDark } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;

const MOBILE_EXISTS_URL = Config.baseURL + 'employee/check/mobile'

class ProVerificationScreen extends Component {
    constructor(props) {
        super();
        this.state = {
            mobile: props.navigation.state.params.mobile,
            otpToMatch: props.navigation.state.params.otp,
            otp: '',
            error: '',
            timer: 30,
            opacity: 1,
            isLoading: false,
        }
    }

    componentDidMount() {
        //From ProLoginPhoneScreen
        this.setState({
            mobile: this.props.navigation.state.params.mobile,
            otpToMatch: this.props.navigation.state.params.otp,
        });

        this.interval = setInterval(
            () => this.setState((prevState) => ({ timer: prevState.timer - 1 })),
            1000
        );
    }

    componentDidUpdate() {
        if (this.state.timer === 0) {
            clearInterval(this.interval);
            this.setState({
                timer: '',
                opacity: 0,

            });
        }
    }

    componentWillUnmount() {
        clearInterval(this.interval);
        this.setState({
            timer: '',
            opacity: 0,
        });
    }

    checkValidation = async () => {
        const { fetchProvidersJobRequests } = this.props;
        if (this.state.otp == '') {
            this.setState({ error: 'Please enter valid OTP' })
        }
        else if (this.state.otp != this.state.otpToMatch) {
            this.setState({ error: 'OTP does not match' })
        }
        else {
            //Check mobile no. is already register or not
            this.setState({
                isLoading: true
            });
            const fcmToken = await messaging().getToken();
            const { updateProviderDetails } = this.props;
            if (fcmToken) {

                const mobileData = {
                    "mobile": this.state.mobile,
                    "fcm_id": fcmToken,
                }

                fetch(MOBILE_EXISTS_URL, {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mobileData)
                })
                    .then((response) => response.json())
                    .then((responseJson) => {

                        console.log("ProVerificationScreen checkValidation : " + JSON.stringify(responseJson));
                        this.setState({
                            isLoading: false
                        })
                        if (responseJson.result) {
                            const id = responseJson.data.id;

                            //Store data like sharedPreference
                            AsyncStorage.setItem('userId', id);
                            AsyncStorage.setItem('userType', 'Provider');

                            var providerData = {
                                providerId: responseJson.data.id,
                                name: responseJson.data.username,
                                imageSource: responseJson.data.image,
                                surname: responseJson.data.surname,
                                mobile: responseJson.data.mobile,
                                services: responseJson.data.services,
                                description: responseJson.data.description,
                                address: responseJson.data.address,
                                lat: responseJson.data.lat,
                                lang: responseJson.data.lang,
                                invoice: responseJson.data.invoice,
                                status: responseJson.data.status,
                            }
                            updateProviderDetails(providerData);
                            fetchProvidersJobRequests({}, id)
                        }
                        else {
                            this.props.navigation.navigate("ProRegister", {
                                'mobile': this.state.mobile
                            })
                        }
                    })
                    .catch((error) => {
                        alert("Error" + error);
                        this.setState({
                            isLoading: false
                        })
                    });
            }
            else {
                // user doesn't have a device token yet
            }
        }
    }

    render() {
        return (
            <View style={styles.container}>

                <StatusBar barStyle='light-content' backgroundColor='#C5940E' />

                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', alwaysBounceVertical: true }}
                    keyboardShouldPersistTaps='always'>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ flex: 0.35, width: screenWidth, backgroundColor: colorYellow, justifyContent: 'center', alignItems: 'center' }}>

                            <TouchableOpacity style={{ width: 20, height: 20, alignSelf: 'flex-start', marginLeft: 15 }}
                                onPress={() => this.props.navigation.goBack()}>
                                <Image style={{ width: 20, height: 20 }}
                                    source={require('../icons/arrow_back.png')} />
                            </TouchableOpacity>

                            <Image
                                style={{ width: 170, height: 170 }}
                                source={require('../images/harfa_logo.png')} />
                        </View>

                        <View style={styles.logincontainer}>

                            <View>
                                <Text style={{ color: colorYellow, fontSize: 18, fontWeight: 'bold', alignItems: 'center', justifyContent: 'center' }}>
                                    Activate your account
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'column' }}>
                                <Text style={{
                                    fontSize: 12, alignItems: 'center', justifyContent: 'center',
                                    textAlign: 'center', marginLeft: 30, marginRight: 30, marginTop: 10,
                                }}>
                                    We're sending an SMS to phone number
                                </Text>
                                <Text style={{
                                    fontSize: 14, alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', textAlign: 'center', marginBottom: 40
                                }}>
                                    {this.state.mobile}
                                </Text>
                            </View>

                            <ShakingText style={{ color: 'red', fontWeight: 'bold', marginBottom: 10 }}>
                                {this.state.error}
                            </ShakingText>

                            <View>
                                <ActivityIndicator
                                    animating={true}
                                    color={colorPrimaryDark}
                                    style={{ opacity: this.state.opacity }}
                                    size="large">
                                </ActivityIndicator>
                                <Text style={{ color: 'black', fontWeight: 'bold', textAlign: 'center' }}>
                                    {this.state.timer}
                                </Text>

                            </View>

                            <View style={styles.textInputView}>
                                <TextInput
                                    style={{ width: screenWidth - 85, height: 50, color: 'black', fontSize: 16, }}
                                    placeholder='Your 6-digits code'
                                    keyboardType='numeric'
                                    onChangeText={(otpInput) => this.setState({ error: '', otp: otpInput })}
                                    value={this.state.otp}>
                                </TextInput>
                            </View>

                            <TouchableOpacity style={styles.buttonContainer}
                                onPress={this.checkValidation}>
                                <Text style={styles.text}>
                                    Verify
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

const mapStateToProps = state => {
    return {
        jobsInfo: state.jobsInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchProvidersJobRequests: (props, providerId, navTo) => {
            dispatch(getPendingJobRequestProvider(props, providerId, navTo));
        },
        updateProviderDetails: details => {
            dispatch(updateProviderDetails(details));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProVerificationScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
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
    separator: {
        borderBottomWidth: 0.8,
        borderBottomColor: '#ebebeb',
        marginTop: 5,
        marginBottom: 5
    },
    buttonContainer: {
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
    }
});