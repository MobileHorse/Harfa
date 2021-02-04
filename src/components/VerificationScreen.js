
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StatusBar, Text, StyleSheet, TextInput, Image, TouchableOpacity,
    Dimensions, ActivityIndicator
} from 'react-native';
import ShakingText from 'react-native-shaking-text';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview'
import AsyncStorage from '@react-native-community/async-storage';
import Config from './Config';
import { updateUserDetails } from '../Redux/Actions/userActions';
import { getPendingJobRequest } from '../Redux/Actions/jobsActions';
import messaging from '@react-native-firebase/messaging';
import { colorYellow, colorPrimaryDark } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const MOBILE_EXISTS_URL = Config.baseURL + 'users/check/mobile'
const USER_GET_PROFILE = Config.baseURL + "users/"

class VerificationScreen extends Component {
    constructor(props) {
        super();
        this.state = {
            mobile: '',
            otpToMatch: props.navigation.state.params.otp,
            otp: '',
            error: '',
            timer: 30,
            opacity: 1,
            isLoading: false,
        }
    }

    componentDidMount() {
        //From LoginPhoneScreen
        this.setState({
            mobile: this.props.navigation.state.params.mobile,
            otpToMatch: this.props.navigation.state.params.otp,
            otp: '',
        });

        this.interval = setInterval(
            () => this.setState((prevState) => ({ timer: prevState.timer - 1 })),
            1000
        );
    }

    componentDidUpdate() {
        const { jobsInfo: { requestsFetched } } = this.props;
        if (requestsFetched) this.setState({ isLoading: false });
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
        if (this.state.otp == '') {
            this.setState({ error: 'Please enter valid OTP' })
        }
        else if (this.state.otp != this.state.otpToMatch) {
            this.setState({ error: 'OTP does not match' })
        }
        else {
            this.setState({
                isLoading: true
            });
            const fcmToken = await messaging().getToken();
            if (fcmToken) {
                const mobileData = {
                    "mobile": this.state.mobile,
                    "fcm_id": fcmToken
                }
                //Check mobile no. is already register or not
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

                        console.log("Response : " + JSON.stringify(responseJson));
                        this.setState({
                            isLoading: false
                        })
                        if (responseJson.result) {
                            const id = responseJson.data.id;

                            //Store data like sharedPreference
                            AsyncStorage.setItem('userId', id);
                            AsyncStorage.setItem('userType', 'User');

                            this.getProfile(id);
                        }
                        else {
                            this.props.navigation.navigate("Register", {
                                'mobile': this.state.mobile
                            });
                        }
                    })
                    .catch((error) => {
                        alert("Error : " + error);
                        this.setState({
                            isLoading: false
                        })
                    });
            }
        }
    }

    getProfile = userId => {
        fetch(USER_GET_PROFILE + userId, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((responseJson) => {
                const { fetchPendingJobRequest } = this.props;
                console.log(JSON.stringify(responseJson));
                if (responseJson.result) {
                    //const id = responseJson.data.id;

                    var userData = {
                        userId: responseJson.data.id,
                        username: responseJson.data.username,
                        image: responseJson.data.image,
                        mobile: responseJson.data.mobile,
                        dob: responseJson.data.dob,
                        address: responseJson.data.address,
                        lat: responseJson.data.lat,
                        lang: responseJson.data.lang,
                        fcmId: responseJson.data.fcm_id
                    }
                    updateUserDetails(userData);
                    //Check if any Ongoing Request 
                    fetchPendingJobRequest(this.props, userId, 'Home');
                }
                else {
                    this.setState({
                        isLoading: false
                    })
                    ToastAndroid.show('Something went wrong with verification', ToastAndroid.SHORT);
                }
            })
            .catch((error) => {
                this.setState({
                    isLoading: false
                })
                alert("Error " + error);
                //console.log(JSON.stringify(responseJson));
            });
    }

    render() {
        return (
            <View style={styles.container}>

                <StatusBar barStyle='light-content' backgroundColor='#C5940E' />

                <KeyboardAwareScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', alwaysBounceVertical: true }}
                    keyboardShouldPersistTaps='handled'
                    keyboardDismissMode='on-drag'>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ flex: 0.35, width: screenWidth, backgroundColor: colorYellow, justifyContent: 'center', alignItems: 'center' }}>

                            <TouchableOpacity style={{ width: 20, height: 20, alignSelf: 'flex-start', marginLeft: 15, marginTop: 5 }}
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
                                    We're sending a 4 digits OTP to phone number
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
                                    placeholder='Your 4-digits code'
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
                </KeyboardAwareScrollView>

                {this.state.isLoading && (
                    <View style={styles.loaderStyle}>
                        <ActivityIndicator
                            style={{ height: 80 }}
                            color="#C00"
                            size="large" />
                    </View>
                )}
            </View>
        );
    }
}

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

const mapStateToProps = state => {
    return {
        jobsInfo: state.jobsInfo,
        userInfo: state.userInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchPendingJobRequest: (props, uid, navigateTo) => {
            dispatch(getPendingJobRequest(props, uid, navigateTo));
        },
        updateUserDetails: details => {
            dispatch(updateUserDetails(details));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(VerificationScreen);