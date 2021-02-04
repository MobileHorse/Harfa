import React, { Component } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Text, BackHandler, StatusBar, Platform, Modal, Animated } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { connect } from 'react-redux';
import RNExitApp from 'react-native-exit-app';
import WaitingDialog from './WaitingDialog';
//import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import Toast from 'react-native-simple-toast';
import ViewPager from "@react-native-community/viewpager";
import Config from './Config';
import Hamburger from './ProHamburger';
import { colorPrimary, colorPrimaryDark, colorBg } from '../Constants/colors';


const screenWidth = Dimensions.get('window').width;

const BOOKING_HISTORY = Config.baseURL + 'jobrequest/employee_request/'
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
    return (
        Platform.OS === 'ios' ?
            <View style={{
                width: "100%",
                height: STATUS_BAR_HEIGHT,
                backgroundColor: colorPrimaryDark
            }}>
                <StatusBar
                    barStyle="light-content" />
            </View>
            :
            <StatusBar barStyle='light-content' backgroundColor={colorPrimaryDark} />
    );
}

class ProBookingScreen extends Component {

    constructor(props) {
        super();
        this.state = {
            bookingCompleteData: [],
            bookingRejectData: [],
            employeeDetails: [],
            currentPage: 0,
            isLoading: true,
            isErrorToast: false,
            backClickCount: 0
        };
        this.springValue = new Animated.Value(100);
    };

    componentDidMount() {
        const { navigation } = this.props;
        this.getAllBookings();
        navigation.addListener('willFocus', async () => {
            this.getAllBookings();
            BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    handleBackButtonClick = () => {
        if (Platform.OS == 'ios')
            this.state.backClickCount == 1 ? RNExitApp.exitApp() : this._spring();
        else
            this.state.backClickCount == 1 ? BackHandler.exitApp() : this._spring();
    }

    _spring = () => {
        this.setState({ backClickCount: 1 }, () => {
            Animated.sequence([
                Animated.spring(
                    this.springValue,
                    {
                        toValue: -.15 * 1,
                        friction: 5,
                        duration: 300,
                        useNativeDriver: true,
                    }
                ),
                Animated.timing(
                    this.springValue,
                    {
                        toValue: 100,
                        duration: 300,
                        useNativeDriver: true,
                    }
                ),

            ]).start(() => {
                this.setState({ backClickCount: 0 });
            });
        });
    }

    getAllBookings = () => {
        this.setState({
            isLoading: true,
            bookingCompleteData: [],
            bookingRejectData: [],
        });
        const { userInfo } = this.props;
        if (userInfo && userInfo.providerDetailsFetched) {
            const { providerDetails } = userInfo;
            fetch(BOOKING_HISTORY + providerDetails.providerId)
                .then((response) => response.json())
                .then((responseJson) => {
                    if (responseJson.result) {
                        for (let i = 0; i < responseJson.data.length; i++) {
                            if (responseJson.data[i].chat_status == "1") {
                                if (responseJson.data[i].status == "Completed") {
                                    this.state.bookingCompleteData.push(responseJson.data[i]);
                                }
                                else if (responseJson.data[i].status == "Rejected") {
                                    this.state.bookingRejectData.push(responseJson.data[i]);
                                }
                            }
                            else {
                                if (responseJson.data[i].status == "Rejected") {
                                    this.state.bookingRejectData.push(responseJson.data[i]);
                                }
                            }
                        }
                        this.setState({
                            isLoading: false
                        })
                    }
                    else {
                        this.setState({
                            isLoading: false
                        })
                    }
                })
                .catch((error) => {
                    console.log(error);
                    this.setState({
                        isLoading: false,
                        isErrorToast: true
                    })
                    this.showToast("Une erreur s'est produite, vérifiez votre connexion Internet")
                    //ToastAndroid.show('Something went wrong, Check your internet connection', ToastAndroid.SHORT);
                })
        }
    }

    onPageSelected = event => {
        currentPage = event.nativeEvent.position;
        this.setState({ currentPage });
    };

    selectPage = title => {
        if (title == "Completed") {
            this.viewPager.setPage(0);
            this.setState({
                currentPage: 0,
            })
        }
        else if (title == "Rejected") {
            this.viewPager.setPage(1);
            this.setState({
                currentPage: 1,
            })
        }
    };

    renderBookingHistoryItem = (item, index) => {
        const userImage = item.user_details.image;
        return (
            <TouchableOpacity
                key={index}
                style={{
                    flex: 1, height: '100%', flexDirection: 'column', backgroundColor: 'white', shadowColor: '#000',
                    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.75, shadowRadius: 5, elevation: 5,
                }}
                onPress={() => this.props.navigation.navigate("ProBookingDetails", {
                    "bookingDetails": item
                })}>

                <View style={styles.itemContainer}>
                    <Image
                        style={{ height: 45, width: 45, alignSelf: 'flex-start', alignContent: 'flex-start', borderRadius: 100 }}
                        source={{ uri: item.user_details.image }} />
                    <View style={{ flexDirection: 'column' }}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: 'bold', textAlignVertical: 'center', marginLeft: 10, }}>
                            {item.user_details.username}
                        </Text>
                        <View style={{ flexDirection: 'row', marginLeft: 10, marginTop: 5 }}>
                            <Image
                                style={{ height: 15, width: 15, alignSelf: 'center', alignContent: 'flex-start', borderRadius: 100, }}
                                source={require('../icons/mobile.png')} />
                            <Text style={{ color: 'black', fontSize: 14, textAlignVertical: 'center', marginLeft: 5 }}>
                                {item.user_details.mobile}
                            </Text>
                        </View>
                    </View>
                    <View style={{ flex: 1, color: 'white', alignContent: 'center', justifyContent: 'center', }}>
                        <Text style={{ textAlign: 'center', alignSelf: 'flex-end', padding: 10, fontSize: 12, color: 'black', marginRight: 10, }}>
                            {item.order_id.replace("\"", "")}
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', backgroundColor: '#fafad2' }}>
                    <Text style={{ color: 'black', fontSize: 14, fontWeight: 'bold', textAlignVertical: 'center', alignSelf: 'center', marginLeft: 10, }}>
                        {item.service_details.service_name}
                    </Text>
                    <View style={{ flex: 1, alignContent: 'center', justifyContent: 'center', }}>
                        <Text style={{ textAlign: 'center', alignSelf: 'flex-end', padding: 10, fontSize: 12, color: 'black', marginRight: 10, }}>
                            {item.createdDate}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
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

                <StatusBarPlaceHolder />
                <View style={{
                    flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                    paddingLeft: 10, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                }}>
                    <Hamburger
                        navigation={this.props.navigation}
                        text='Réservations'
                    />
                </View>

                <View style={{
                    width: screenWidth, height: 50, justifyContent: 'center',
                    backgroundColor: colorPrimaryDark, alignItems: 'center'
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 10, marginBottom: 10 }}>
                        <TouchableOpacity style={this.state.currentPage == 0 ? styles.buttonGreen : styles.buttonPrimaryDark}
                            onPress={() => this.selectPage("Completed")}>
                            <Text style={styles.text}>Terminé</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={this.state.currentPage == 1 ? styles.buttonRed : styles.buttonPrimaryDark}
                            onPress={() => this.selectPage("Rejected")}>
                            <Text style={styles.text}>Rejeté</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ViewPager
                    style={styles.viewPager}
                    initialPage={0}
                    ref={viewPager => { this.viewPager = viewPager }}
                    onPageSelected={(event) => this.onPageSelected(event)}>
                    <View key="1">
                        <View style={styles.listView}>
                            {this.state.bookingCompleteData.map(this.renderBookingHistoryItem)}
                        </View>
                        {this.state.bookingCompleteData.length == 0 && !this.state.isLoading && (
                            <View style={styles.loaderStyle}>
                                <Text style={{ color: 'black', fontSize: 20 }}>
                                    Aucune réservation trouvée!
                                </Text>
                            </View>
                        )}
                    </View>
                    <View key="2">
                        <View style={styles.listView}>
                            {this.state.bookingCompleteData.map(this.renderBookingHistoryItem)}
                        </View>
                        {this.state.bookingRejectData.length == 0 && !this.state.isLoading && (
                            <View style={styles.loaderStyle}>
                                <Text style={{ color: 'black', fontSize: 20 }}>
                                    Aucune réservation trouvée!
                                </Text>
                            </View>
                        )}
                    </View>
                </ViewPager>

                <Animated.View style={[styles.animatedView, { transform: [{ translateY: this.springValue }] }]}>
                    <Text style={styles.exitTitleText}>Press back again to exit the app</Text>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => BackHandler.exitApp()}>
                        <Text style={styles.exitText}>Exit</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                    onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                    <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                </Modal>
            </View>
        );
    }
}

const mapStateToProps = state => ({
    userInfo: state.userInfo
});

const mapDispatchToProps = dispatch => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(ProBookingScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg,
    },
    viewPager: {
        flex: 1
    },
    pageStyle: {
        alignItems: 'center',
        padding: 20,
        color: 'black',
    },
    buttonGreen: {
        flex: 1,
        height: 40,
        paddingTop: 10,
        backgroundColor: 'green',
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 1,
        borderColor: colorPrimaryDark,
        borderWidth: 0,
        textAlign: 'center',
        justifyContent: 'center',
        marginLeft: 5,
        marginRight: 5
    },
    buttonRed: {
        flex: 1,
        height: 40,
        paddingTop: 10,
        backgroundColor: 'red',
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 1,
        borderColor: colorPrimaryDark,
        borderWidth: 0,
        textAlign: 'center',
        justifyContent: 'center',
        marginLeft: 5,
        marginRight: 5
    },
    buttonPrimaryDark: {
        flex: 1,
        height: 40,
        paddingTop: 10,
        backgroundColor: colorPrimaryDark,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 1,
        borderColor: colorPrimaryDark,
        borderWidth: 0,
        textAlign: 'center',
        justifyContent: 'center',
        marginLeft: 5,
        marginRight: 5
    },
    text: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
    },
    listView: {
        flex: 1,
        backgroundColor: colorBg,
        padding: 5,
    },
    itemContainer: {
        width: screenWidth,
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 10,
    },
    animatedView: {
        width: screenWidth,
        backgroundColor: colorPrimaryDark,
        elevation: 2,
        position: "absolute",
        bottom: 0,
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },
    exitTitleText: {
        textAlign: "center",
        color: 'white',
        marginRight: 20,
    },
    exitText: {
        color: 'red',
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 3
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
})