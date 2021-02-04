import React, { Component } from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet, Dimensions, PermissionsAndroid, BackHandler, Platform, StatusBar, Modal} from 'react-native';
import {connect} from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-simple-toast';
import WaitingDialog from './WaitingDialog';
import { updateUserDetails } from '../Redux/Actions/userActions';
import { colorPrimary, colorPrimaryDark, colorBg, colorGray, colorYellow } from '../Constants/colors';
import Config from './Config';

const screenWidth = Dimensions.get('window').width;

const USER_INFO_UPDATE = Config.baseURL + "users/";
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

function StatusBarPlaceHolder() {
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

class AddAddressScreen extends Component {

    constructor(props) {
        super();
        const { userInfo: { userDetails } } = props;
        this.state = {
            latitude: userDetails.lat,
            longitude: userDetails.lang,
            error: null,
            address: userDetails.address,
            isLoading: true,
            isErrorToast: false,
        };
        this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    };

    watchID = null;

    componentDidMount() {
        const { navigation } = this.props;
        navigation.addListener('willFocus', async () => {
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        const { userInfo: { userDetails } } = this.props;
        if (this.state.address != '') {
            this.setState({
                address: userDetails.address,
                latitude: userDetails.lat,
                longitude: userDetails.lang,
                isLoading: false
            })
        }
        else {
            this.setState({
                address: 'Getting address...',
                latitude: 0,
                longitude: 0,
            });
            this.getCurrentLocation();
        }
    }

    componentWillUnmount() {
        this.watchID != null && Geolocation.clearWatch(this.watchID);
    }

    handleBackButtonClick() {
        this.props.navigation.goBack();
        return true;
    }

    async getCurrentLocation() {
        const { updateUserDetails, userInfo: { userDetails } } = this.props

        if (Platform.OS == 'ios') {
            await Geolocation.requestAuthorization();

            Geolocation.getCurrentPosition(
                (position) => {
                    console.log("Position : " + JSON.stringify(position));

                    this.setState({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });

                    //Update Address to Database
                    fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + position.coords.latitude + ',' + position.coords.longitude + '&key=' + 'AIzaSyAHu_ej6SvwW0vVbhu4A30OPayIAPFV030')
                        .then((response) => response.json())
                        .then((responseJson) => {

                            console.log('ADDRESS GEOCODE is BACK!! => ' + JSON.stringify(responseJson.results[0].formatted_address));

                            this.setState({
                                address: responseJson.results[0].formatted_address,
                                isLoading: false,
                            })

                            const userData = {
                                "address": responseJson.results[0].formatted_address,
                                "lat": this.state.latitude,
                                "lang": this.state.longitude,
                            }

                            fetch(USER_INFO_UPDATE + userDetails.userId,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(userData)
                                })
                                .then((response) => response.json())
                                .then((response) => {
                                    console.log("Response >> " + JSON.stringify(response));
                                    if (response.result) {
                                        this.setState({
                                            isLoading: false,
                                        })
                                        var userData = {
                                            userId: response.data.id,
                                            accountType: response.data.acc_type,
                                            email: response.data.email,
                                            password: response.data.password,
                                            username: response.data.username,
                                            image: response.data.image,
                                            mobile: responseJson.data.mobile,
                                            dob: response.data.dob,
                                            address: response.data.address,
                                            lat: response.data.lat,
                                            lang: response.data.lang,
                                            fcmId: response.data.fcm_id,
                                        }
                                        updateUserDetails(userData)
                                    }
                                    else {
                                        this.setState({
                                            isLoading: false,
                                        })
                                        this.showToast(response.message);
                                    }
                                })
                                .catch((error) => {
                                    console.log("Error :" + error);
                                    this.setState({
                                        isLoading: false,
                                    })
                                })
                                .done()
                        })

                }, (error) => {
                    console.log("Error: " + error.code, error);
                    console.log("Error: " + error.code, error.message);
                    this.setState({
                        isLoading: false,
                        isErrorToast: true,
                    })
                    this.showToast(error.message);
                },
                {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
            );
        }
        else {
            const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            if (granted) {
                Geolocation.getCurrentPosition(
                    (position) => {
                        console.log("Position >> " + JSON.stringify(position));
                        this.setState({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });

                        //Update Address to Database
                        fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + position.coords.latitude + ',' + position.coords.longitude + '&key=' + 'AIzaSyAHu_ej6SvwW0vVbhu4A30OPayIAPFV030')
                            .then((response) => response.json())
                            .then((responseJson) => {
                                const { userInfo: { userDetails }, updateUserDetails } = this.props;
                                this.setState({
                                    address: responseJson.results[0].formatted_address,
                                    isLoading: false,
                                })

                                const userData = {
                                    "address": responseJson.results[0].formatted_address,
                                    "lat": this.state.latitude,
                                    "lang": this.state.longitude,
                                }

                                fetch(USER_INFO_UPDATE + userDetails.userId,
                                    {
                                        method: 'POST',
                                        headers: {
                                            'Accept': 'application/json',
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify(userData)
                                    })
                                    .then((response) => response.json())
                                    .then((response) => {
                                        if (response.result) {
                                            this.setState({
                                                isLoading: false,
                                            })
                                            var userData = {
                                                userId: response.data.id,
                                                accountType: response.data.acc_type,
                                                email: response.data.email,
                                                password: response.data.password,
                                                username: response.data.username,
                                                image: response.data.image,
                                                mobile: response.data.mobile,
                                                dob: response.data.dob,
                                                address: response.data.address,
                                                lat: response.data.lat,
                                                lang: response.data.lang,
                                                fcmId: response.data.fcm_id,
                                            }
                                            updateUserDetails(userData);
                                        }
                                        else {
                                            this.setState({
                                                isLoading: false,
                                            })
                                            this.showToast(response.message);
                                        }
                                    })
                                    .catch((error) => {
                                        console.log("Error :" + error);
                                        this.setState({
                                            isLoading: false,
                                        })
                                    })
                                    .done()
                            })
                    },
                    (error) => {
                        console.log("Error: " + error.code, error.message);
                        this.setState({
                            isErrorToast: true
                        })
                        this.showToast(error.message);
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                );
            }
            else {
                this.permissionRequest()
            }
        }
        this.watchID = Geolocation.watchPosition(position => {
            const lastPosition = JSON.stringify(position);
            this.setState({lastPosition});
          });
    }

    async permissionRequest() {
        try {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {

                Geolocation.getCurrentPosition(
                    (position) => {
                        console.log("Position : " + JSON.stringify(position));
                        this.setState({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });

                        fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + position.coords.latitude + ',' + position.coords.longitude + '&key=' + 'AIzaSyAHu_ej6SvwW0vVbhu4A30OPayIAPFV030')
                            .then((response) => response.json())
                            .then((responseJson) => {

                                console.log('ADDRESS GEOCODE is BACK!! ==> ' + JSON.stringify(responseJson.results[0].formatted_address));

                                this.updateAddressToDatabase(position.coords.latitude, position.coords.longitude,responseJson.results[0].formatted_address);
                            })
                    });

            } else {
                console.log("location permission denied")
            }
        } catch (err) {
            console.warn(err)
        }
    }

    getDataFromAddAddressScreen = (data) => {

        this.setState({
            isLoading: true,
        })
        console.log("Data : " + data);

        var data = data.split("/")
        this.setState({
            address: data[0],
            latitude: data[1],
            longitude: data[2],
        });

        this.updateAddressToDatabase(data[1], data[2], data[0] )
    }

    //Update Address to Database
    updateAddressToDatabase(latitude, longitude, address) {
        const userData = {
            "address": address,
            "lat": latitude,
            "lang": longitude,
        };
        const { userInfo: { userDetails }, updateUserDetails } = this.props;

        fetch(USER_INFO_UPDATE + userDetails.userId,
         {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            })
            .then((response) => response.json())
            .then((response) => {
                console.log("Response" + JSON.stringify(response));
                if (response.result) {
                    this.setState({
                        isLoading: false,
                        address: address,
                    })

                    var userData = {
                        userId: response.data.id,
                        accountType: response.data.acc_type,
                        email: response.data.email,
                        password: response.data.password,
                        username: response.data.username,
                        image: response.data.image,
                        mobile: response.data.mobile,
                        dob: response.data.dob,
                        address: response.data.address,
                        lat: response.data.lat,
                        lang: response.data.lang,
                        fcmId: response.data.fcm_id,
                    }
                    updateUserDetails(userData)
                    this.showToast(response.message);
                }
                else {
                    this.setState({
                        isLoading: false,
                    })
                    this.showToast(response.message);
                }
            })
            .catch((error) => {
                console.log("Error :" + error);
                this.setState({
                    isLoading: false,
                })
            })
            .done()
    }

    showToast = (message) => {
        Toast.show(message);
    }

    changeWaitingDialogVisibility = (bool) => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        return (
            <View style={styles.container}>

                <StatusBarPlaceHolder/>

                <View style={styles.header}>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', 
                            justifyContent: 'center', }}
                            onPress={() => this.props.navigation.goBack()}>
                            <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                source={require('../icons/arrow_back.png')} />
                        </TouchableOpacity>

                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                            Ma position
                        </Text>
                    </View>
                </View>

                <View style={styles.mainContainer}>
                    <Text style={{ color: 'black', fontSize: 20, fontWeight: 'bold', alignSelf: 'flex-start', }}>
                        Ma position
                    </Text>

                    <View style={{
                        width: screenWidth - 40, flexDirection: 'row', backgroundColor: 'white',
                        alignContent: 'center', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.75, shadowRadius: 5, elevation: 5, marginTop: 15}}>
                        <Text style={{ color: colorGray, fontWeight: 'bold', fontSize: 16 }}>
                            {this.state.address}
                        </Text>
                    </View>

                    <TouchableOpacity style={[styles.buttonContainer, { marginTop: 40, }]}
                        onPress={() => this.props.navigation.navigate('SelectAddress', {
                            onGoBack: this.getDataFromAddAddressScreen,
                        })}>
                        <Text style={styles.text}>
                            Changer de lieu
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* {this.state.isLoading && (
                    <View style={styles.loaderStyle}>
                        <ActivityIndicator
                            style={{ height: 80 }}
                            color="#C00"
                            size="large" />
                    </View>
                )} */}
                 <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                    onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                    <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                </Modal>
            </View>
        );
    }
}

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo,
        userInfo: state.userInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchNotifications: data => {
            dispatch(startFetchingNotification(data));
        },
        updateUserDetails: details => {
            dispatch(updateUserDetails(details));
        },
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddAddressScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg,
    },
    header: {
        flexDirection: 'row',
        width: '100%',
        height: 50,
        backgroundColor: colorPrimary,
        paddingLeft: 10,
        paddingRight: 20,
        paddingTop: 5,
        paddingBottom: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    mainContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        padding: 20
    },
    buttonContainer: {
        width: screenWidth - 100,
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