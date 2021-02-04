
import React, { Component } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, Dimensions,
    ActivityIndicator, BackHandler, StatusBar, Platform, Modal, Animated
} from 'react-native';
//import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import { connect } from 'react-redux';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import Toast from 'react-native-simple-toast';
//import { DrawerActions } from 'react-navigation-drawer';
import RNExitApp from 'react-native-exit-app';
import Config from './Config';
import WaitingDialog from './WaitingDialog';
import Notifications from './Notifications';
import Hamburger from './Hamburger';
import { colorYellow, colorPrimaryDark, colorBg, colorGray } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;

const NOTIFICATION_URL = Config.baseURL + "notification/get-customer-notification/";
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

class NotificationsScreen extends Component {

    constructor(props) {
        super();
        this.state = {
            isLoading: true,
            isNoData: false,
            dataSource: [],
            backClickCount: 0,
        };
        this.springValue = new Animated.Value(100);
    };

    componentDidMount() {
        const { fetchedNotifications, navigation } = this.props;
        fetchedNotifications({ type: 'generic', value: 0 });
        this.getAllNotifications();
        navigation.addListener('willFocus', async () => {
            this.getAllNotifications();
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
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

    getAllNotifications = () => {
        this.setState({
            isLoading: true
        });

        const { userInfo: { userDetails } } = this.props;

        fetch(NOTIFICATION_URL + userDetails.userId)
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.result) {
                    this.setState({
                        dataSource: responseJson.data,
                        isLoading: false,
                        isNoData: !responseJson.data || responseJson.data.length === 0
                    })
                }
                else {
                    this.setState({
                        isLoading: false,
                        isNoData: true
                    })
                }
            })
            .catch((error) => {
                console.log(error);
                this.setState({
                    isLoading: false,
                    isNoData: true
                })
                this.showToast("Une erreur s'est produite, vérifiez votre connexion Internet")
            })
    }

    showToast = (message) => {
        Toast.show(message);
    }

    //GridView Items
    renderItem = (item, index) => {
        if (item)
            return (
                <TouchableOpacity
                    key={index}
                    style={{
                        flex: 1, flexDirection: 'row', margin: 5, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.75, shadowRadius: 2, elevation: 2, backgroundColor: 'white', borderRadius: 2, justifyContent: 'center'
                    }}>

                    <View style={{ justifyContent: 'center', alignContent: 'center' }}>
                        <Image style={{ width: 45, height: 45, borderRadius: 100, alignItems: 'center', }}
                            source={{ uri: item.employee_details.image }} />
                    </View>

                    <View style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', marginLeft: 10 }}>
                        <Text style={{ color: 'black', fontSize: 15, marginTop: 5, fontWeight: 'bold' }}>
                            {item.title}
                        </Text>
                        <Text style={{ color: 'grey', fontSize: 13, marginTop: 2, }}>
                            {item.message}
                        </Text>
                        <Text style={{ fontWeight: 'bold', color: colorGray, fontSize: 10, marginTop: 2, }}>
                            {item.createdDate}
                        </Text>
                    </View>
                </TouchableOpacity>
            )
    }

    changeWaitingDialogVisibility = bool => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        return (

            <View style={styles.container}>

                <StatusBarPlaceHolder />

                <View style={styles.header} >
                    <Hamburger
                        Notifications={Notifications}
                        navigation={this.props.navigation}
                        text='Notifications'
                    />
                </View>
                {!this.state.isLoading && !this.state.isNoData &&
                    <View style={styles.listView}>
                        {this.state.dataSource.map(this.renderItem)}
                    </View>
                }
                {this.state.isNoData && (
                    <View style={{ flex: 1, flexDirection: 'column', backgroundColor: colorBg, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: 100, height: 100, borderRadius: 100, backgroundColor: colorYellow, justifyContent: 'center', alignItems: 'center' }}>
                            <Image style={{ width: 50, height: 50 }}
                                source={require('../icons/ic_notification.png')} />
                        </View>
                        <Text style={{ fontSize: 18, marginTop: 10 }}>Notifications non trouvées</Text>
                    </View>
                )}
                {/* {this.state.isLoading && (
                <View style={styles.loaderStyle}>
                    <ActivityIndicator
                        style={{ height: 80 }}
                        color="#C00"
                        size="large" />
                </View>
            )} */}
                <Animated.View style={[styles.animatedView, { transform: [{ translateY: this.springValue }] }]}>
                    <Text style={styles.exitTitleText}>Appuyez à nouveau pour quitter l'application</Text>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => BackHandler.exitApp()}>
                        <Text style={styles.exitText}>Sortie</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        width: '100%',
        height: 50,
        flexDirection: 'row',
        backgroundColor: colorYellow,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    listView: {
        flex: 1,
        backgroundColor: colorBg,
        padding: 5,
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
});

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
        fetchedNotifications: data => {
            dispatch(notificationsFetched(data));
        },
        fetchingNotificationsError: error => {
            dispatch(notificationError(error));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(NotificationsScreen);