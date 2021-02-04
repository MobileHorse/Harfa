import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View, Image, StatusBar, ActivityIndicator, Platform, Alert, BackHandler } from 'react-native';
import { createAppContainer, } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import AsyncStorage from '@react-native-community/async-storage';
import RNExitApp from 'react-native-exit-app';
import database from '@react-native-firebase/database';
import HomeScreen from './HomeScreen';
import DashboardScreen from './DashboardScreen';
import ProDashboardScreen from './ProDashboardScreen';
import AfterSplashScreen from './AfterSplashScreen';
import AccountTypeScreen from './AccountTypeScreen';
import FacebookGoogleScreen from './FacebookGoogleScreen';
import RegisterScreen from './RegisterScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import ProFacebookGoogleScreen from './ProFacebookGoogleScreen';
import ProForgotPasswordScreen from './ProForgotPasswordScreen';
import ProRegisterFBScreen from './ProRegisterFBScreen';
import ProRegisterScreen from './ProRegisterScreen';
import ProServiceSelectScreen from './ProServiceSelectScreen';
import ProHomeScreen from './ProHomeScreen';
import ProAccountTypeScreen from './ProAccountTypeScreen';
import SelectAddressScreen from './SelectAddressScreen';
import firebaseAuth from '@react-native-firebase/auth';
import Config from './Config';
import { updateUserDetails, updateProviderDetails } from '../Redux/Actions/userActions';
import messaging from '@react-native-firebase/messaging';
import { getPendingJobRequest, getPendingJobRequestProvider, getAllWorkRequestPro, getAllWorkRequestClient } from '../Redux/Actions/jobsActions';
import SimpleToast from 'react-native-simple-toast';

const PRO_GET_PROFILE = Config.baseURL + "employee/";
const USER_GET_PROFILE = Config.baseURL + "users/";

class SplashScreen extends Component {

    constructor(props) {
        super();
        this.state = {
            id: null,
            isLoading: false,
        };
    };

    componentDidMount() {
        setTimeout(this.splashTimeOut, 3000);
    }

    componentDidUpdate() {
        const { jobsInfo: { requestsProvidersFetched, requestsFetched } } = this.props;
        if (requestsProvidersFetched && requestsFetched && this.state.isLoading === true) this.setState({ isLoading: false });
    }

    splashTimeOut = () => {
        AsyncStorage.getItem('userId')
            .then((userId) => this.getUserType(userId));
    }

    getUserType = async userId => {
        messaging().requestPermission().then(authStatus => {
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            if (enabled) {
                this.getFCMToken(userId);
            }
            else {
                Alert.alert(
                    "Permission Request",
                    "You don't have permission for notification. Please enable notification then try again ",
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                if (Platform.OS == 'android')
                                    BackHandler.exitApp();
                                else
                                    RNExitApp.exitApp();
                            },
                            style: 'cancel',
                        },
                    ]
                );
            }
        }).catch(error => {
            console.log('Messaging permission error --', error)
            Alert.alert(
                "Permission Request",
                "You don't have permission for notification. Please enable notification then try again ",
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            if (Platform.OS == 'android')
                                BackHandler.exitApp();
                            else
                                RNExitApp.exitApp();
                        },
                        style: 'cancel',
                    },
                ]
            );
        });
    }

    getFCMToken = async userId => {
        messaging().getToken().then(fcmToken => {
            if (fcmToken) {
                AsyncStorage.getItem('userType')
                    .then(userType => this.autoLogin(userId, userType, fcmToken));
            }
            else {
                // user doesn't have a device token yet
                console.log("User doesn't have Token")
            }
        }).catch(error => {
            Alert.alert(
                "Auth Token",
                "Your device has not received an authentication token, check your internet connection and try again later",
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            if (Platform.OS == 'android')
                                BackHandler.exitApp();
                            else
                                RNExitApp.exitApp();
                        },
                        style: 'cancel',
                    },
                ]
            );
            console.log('fcm token error --', error)
        });
    }

    inhouseLogin = (userId, userType, fcmToken) => {
        const { fetchPendingJobProviderInfo, fetchJobRequestHistoryPro, fetchJobRequestHistoryClient, fetchPendingJobRequest, updateProviderDetails, updateUserDetails } = this.props;
        if (userType == 'Provider') {
            console.log("userId: ", userId);
            console.log("fcm_id: ", fcmToken);
            fetch(PRO_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then(async responseJson => {
                    var status;
                    if (responseJson && responseJson.result) {
                        const id = responseJson.data.id;
                        const usersRef = database().ref(`users/${id}`);
                        await usersRef.once('value', snapshot => {
                            const value = snapshot.val();
                            if (value)
                                status = value.status;
                            else {
                                usersRef.set({ 'status': responseJson.data.status }).then(() => {
                                    console.log('status set');
                                }).
                                    catch(e => {
                                        console.log(e.message);
                                    });
                            }
                        });
                        var providerData = {
                            providerId: responseJson.data.id,
                            name: responseJson.data.username,
                            email: responseJson.data.email,
                            password: responseJson.data.password,
                            imageSource: responseJson.data.image,
                            surname: responseJson.data.surname,
                            mobile: responseJson.data.mobile,
                            services: responseJson.data.services,
                            description: responseJson.data.description,
                            address: responseJson.data.address,
                            lat: responseJson.data.lat,
                            lang: responseJson.data.lang,
                            invoice: responseJson.data.invoice,
                            status: status != undefined ? status : responseJson.data.status,
                            fcmId: responseJson.data.fcm_id,
                            accountType: responseJson.data.account_type
                        }
                        updateProviderDetails(providerData);
                        fetchJobRequestHistoryPro(userId);
                        fetchPendingJobProviderInfo(this.props, userId, 'ProHome');
                    }
                    else {
                        this.setState({
                            isLoading: false
                        })
                        Alert.alert(
                            "OOPS !",
                            responseJson.message,
                            [
                                {
                                    text: 'Cancel',
                                    onPress: () => console.log('Cancel Pressed'),
                                },
                                {
                                    text: 'Retry',
                                    onPress: () => this.autoLogin(userId, userType, fcmToken),
                                },
                            ]
                        );
                    }
                })
                .catch(error => {
                    this.setState({
                        isLoading: false
                    })
                    alert(error);
                    console.log('error in autologin')
                    console.log(JSON.stringify(responseJson));
                });
        }
        else if (userType == 'User') {

            console.log("----------- client inhouselogin ----------");
            console.log(USER_GET_PROFILE + userId + '?fcm_id=' + fcmToken);
            fetch(USER_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(responseJson => {
                    if (responseJson && responseJson.result) {
                        var userData = {
                            userId: responseJson.data.id,
                            accountType: responseJson.data.acc_type,
                            email: responseJson.data.email,
                            password: responseJson.data.password,
                            username: responseJson.data.username,
                            image: responseJson.data.image,
                            mobile: responseJson.data.mobile,
                            dob: responseJson.data.dob,
                            address: responseJson.data.address,
                            lat: responseJson.data.lat,
                            lang: responseJson.data.lang,
                            fcmId: responseJson.data.fcm_id,
                        }
                        updateUserDetails(userData);
                        //Check if any Ongoing Request 
                        fetchJobRequestHistoryClient(userId);
                        fetchPendingJobRequest(this.props, userId, 'Home');
                    }
                    else {
                        this.setState({
                            isLoading: false
                        })
                        Alert.alert(
                            "OOPS !",
                            responseJson.message,
                            [
                                {
                                    text: 'Cancel',
                                    onPress: () => console.log('Cancel Pressed'),
                                },
                                {
                                    text: 'Retry',
                                    onPress: () => this.autoLogin(userId, userType, fcmToken),
                                },
                            ]
                        );
                    }
                }).
                catch((error) => {
                    this.setState({
                        isLoading: false
                    })
                    alert(error);
                    console.log(JSON.stringify(responseJson));
                });
        }
    }

    autoLogin = (userId, userType, fcmToken) => {
        if (userId !== null) {
            this.setState({
                isLoading: true,
            });
            AsyncStorage.getItem('auth').then(storedInfo => {
                if (storedInfo) {
                    const { email, password } = JSON.parse(storedInfo);
                    firebaseAuth().signInWithEmailAndPassword(email, password).then(res => {
                        this.inhouseLogin(userId, userType, fcmToken);
                    }).catch(error => {
                        SimpleToast.show('Something went wrong, try closing and reopening app');
                        console.log('auth error --', error)
                    });
                }
                else this.inhouseLogin(userId, userType, fcmToken);
            });
        }
        else {
            console.log("No Logged User");
            this.props.navigation.navigate("AfterSplash");
        }
    }

    render() {
        return (
            <View style={styles.container}>

                <StatusBar barStyle='light-content' backgroundColor='#000000' />

                <Image
                    style={{ width: 250, height: 250 }}
                    source={require('../images/harfa_logo.png')} />

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
        fetchPendingJobProviderInfo: (props, proId, navigateTo) => {
            dispatch(getPendingJobRequestProvider(props, proId, navigateTo));
        },
        fetchJobRequestHistoryPro: providerId => {
            dispatch(getAllWorkRequestPro(providerId));
        },
        fetchJobRequestHistoryClient: clientId => {
            dispatch(getAllWorkRequestClient(clientId));
        },
        updateUserDetails: details => {
            dispatch(updateUserDetails(details));
        },
        updateProviderDetails: details => {
            dispatch(updateProviderDetails(details));
        }
    }
}

const SplashScreenComponent = connect(mapStateToProps, mapDispatchToProps)(SplashScreen);

const AppStackNavigator = createStackNavigator({
    Splash: {
        screen: SplashScreenComponent,
        navigationOptions: {
            header: null
        }
    },
    AfterSplash: {
        screen: AfterSplashScreen,
        navigationOptions: {
            header: null
        }
    },
    FacebookGoogle: {
        screen: FacebookGoogleScreen,
        navigationOptions: {
            header: null
        }
    },
    ForgotPassword: {
        screen: ForgotPasswordScreen,
        navigationOptions: {
            header: null
        }
    },
    Register: {
        screen: RegisterScreen,
        navigationOptions: {
            header: null
        }
    },
    Dashboard: {
        screen: DashboardScreen,
        navigationOptions: {
            header: null
        }
    },
    ProDashboard: {
        screen: ProDashboardScreen,
        navigationOptions: {
            header: null
        }
    },
    Home: {
        screen: HomeScreen,
        navigationOptions: {
            header: null
        }
    },
    AccountType: {
        screen: AccountTypeScreen,
        navigationOptions: {
            header: null
        }
    },
    ProFacebookGoogle: {
        screen: ProFacebookGoogleScreen,
        navigationOptions: {
            header: null
        }
    },
    ProForgotPassword: {
        screen: ProForgotPasswordScreen,
        navigationOptions: {
            header: null
        }
    },
    ProAccountType: {
        screen: ProAccountTypeScreen,
        navigationOptions: {
            header: null
        }
    },
    ProRegisterFB: {
        screen: ProRegisterFBScreen,
        navigationOptions: {
            header: null
        }
    },
    ProRegister: {
        screen: ProRegisterScreen,
        navigationOptions: {
            header: null
        }
    },
    ProServiceSelect: {
        screen: ProServiceSelectScreen,
        navigationOptions: {
            header: null
        }
    },
    SelectAddress: {
        screen: SelectAddressScreen,
        navigationOptions: {
            header: null
        }
    },
    ProHome: {
        screen: ProHomeScreen,
        navigationOptions: {
            header: null
        }
    },
});

const App = createAppContainer(AppStackNavigator);
export default App;

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center'
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
}
