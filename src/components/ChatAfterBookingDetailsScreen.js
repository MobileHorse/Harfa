import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StyleSheet, TouchableOpacity, Image, Text,
    FlatList, TextInput, Dimensions, ActivityIndicator,
    BackHandler, ImageBackground, StatusBar, Platform, Alert, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import database from '@react-native-firebase/database';
import { imageExists } from '../misc/helpers';
import Config from './Config';
import { colorPrimary, colorPrimaryDark, colorGray, colorBg, inactiveBackground, buttonPrimary, inactiveText, white } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;
const SEND_NOTIFICATION = Config.baseURL + "notification/sendNotification";

const StatusBarPlaceHolder = () => {
    return (
        ios ?
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

class ChatAfterBookingDetailsScreen extends Component {
    constructor(props) {
        super()
        const { userInfo: { userDetails }, jobsInfo: { selectedJobRequest: { employee_id } } } = props;
        this.state = {
            senderId: userDetails.userId,
            senderImage: userDetails.image,
            senderName: userDetails.username,
            inputMessage: '',
            showButton: false,
            dataChatSource: props.messagesInfo.dataChatSource[employee_id],
            isLoading: !props.messagesInfo.fetched,
            isUpLoading: false,
            receiverId: props.navigation.state.params.providerId,
            receiverName: props.navigation.state.params.providerName + " " + props.navigation.state.params.providerSurname,
            receiverImage: props.navigation.state.params.providerImage,
            serviceName: props.navigation.state.params.serviceName,
            orderId: props.navigation.state.params.orderId,
            titlePage: props.navigation.state.params.pageTitle,
            isJobAccepted: props.navigation.state.params.isJobAccepted,
            proImageAvailable: null,
            provider_FCM_id: props.navigation.state.params.fcmId,
        }
    };

    componentDidMount() {
        const { fetchedNotifications, navigation } = this.props;
        fetchedNotifications({ type: 'messages', value: 0 });
        imageExists(this.props.navigation.state.params.providerImage).then(proImageAvailable => {
            this.setState({ proImageAvailable });
        });

        navigation.addListener('willFocus', async () => {
            this.reInit();
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    reInit = () => {
        const props = this.props;
        const { userInfo: { userDetails }, jobsInfo: { selectedJobRequest: { employee_id } } } = props;
        this.setState({
            senderId: userDetails.userId,
            senderImage: userDetails.image,
            senderName: userDetails.username,
            inputMessage: '',
            showButton: false,
            dataChatSource: props.messagesInfo.dataChatSource[employee_id],
            isLoading: !props.messagesInfo.fetched,
            isUpLoading: false,
            receiverId: props.navigation.state.params.providerId,
            receiverName: props.navigation.state.params.providerName + " " + props.navigation.state.params.providerSurname,
            receiverImage: props.navigation.state.params.providerImage,
            serviceName: props.navigation.state.params.serviceName,
            orderId: props.navigation.state.params.orderId,
            titlePage: props.navigation.state.params.pageTitle,
            isJobAccepted: props.navigation.state.params.isJobAccepted,
            proImageAvailable: null,
            provider_FCM_id: props.navigation.state.params.fcmId,
        });
    }

    componentDidUpdate() {
        const { messagesInfo: { fetched, dataChatSource }, jobsInfo: { selectedJobRequest: { employee_id } } } = this.props;
        const { isLoading } = this.state;
        const localDataChatSource = this.state.dataChatSource;
        if (fetched && isLoading)
            this.setState({ isLoading: false });
        if (JSON.stringify(dataChatSource[employee_id]) !== JSON.stringify(localDataChatSource))
            this.setState({ dataChatSource: dataChatSource[employee_id] });
    }

    handleBackButtonClick = () => {
        this.props.navigation.goBack();
        return true;
    }

    convertTime = time => {
        let d = new Date(time);
        let c = new Date();
        let result = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':';
        result += (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        if (c.getDay() !== d.getDay()) {
            result = d.getDay() + '/' + d.getMonth() + "/" + d.getFullYear() + ', ' + result;
        }
        return result;
    }

    showHideButton = input => {

        this.setState({
            inputMessage: input,
        })
        if (input == '') {
            this.setState({
                showButton: false,
            })
        }
        else {
            this.setState({
                showButton: true,
            })
        }
    }

    sendMessageTask = async () => {
        const { inputMessage, senderId, senderName, senderImage, receiverId, receiverImage, provider_FCM_id, receiverName, serviceName, orderId } = this.state;
        if (this.state.inputMessage.length > 0) {
            this.setState({
                inputMessage: '',
                showButton: false,
            });
            let msgId = database().ref('chatting').child(senderId).child(receiverId).push().key;
            let updates = {};
            let recentUpdates = {};
            let message = {
                textMessage: inputMessage,
                imageMessage: '',
                time: database.ServerValue.TIMESTAMP,
                senderId: senderId,
                senderImage: senderImage,
                senderName: senderName,
                receiverId: receiverId,
                receiverName: receiverName,
                receiverImage: receiverImage,
                serviceName: serviceName,
                orderId: orderId,
                type: "text",
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
            }
            let recentMessageReceiver = {
                textMessage: inputMessage,
                imageMessage: '',
                time: database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: senderId,
                name: senderName,
                image: senderImage,
                serviceName: serviceName,
                orderId: orderId,
                type: "text",
            }
            let recentMessageSender = {
                textMessage: inputMessage,
                imageMessage: '',
                time: database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: receiverId,
                name: receiverName,
                image: receiverImage,
                serviceName: serviceName,
                orderId: orderId,
                type: "text",
            }
            updates['chatting/' + senderId + '/' + receiverId + '/' + msgId] = message;
            updates['chatting/' + receiverId + '/' + senderId + '/' + msgId] = message;
            database().ref().update(updates);

            recentUpdates['recentMessage/' + senderId + '/' + receiverId] = recentMessageSender;
            recentUpdates['recentMessage/' + receiverId + '/' + senderId] = recentMessageReceiver;

            database().ref().update(recentUpdates);

            const notification = JSON.stringify({
                "fcm_id": provider_FCM_id,
                "type": "Message",
                "user_id": senderId,
                "employee_id": receiverId,
                "order_id": orderId,
                "notification_by": "Client",
                "title": "Message Recieved",
                "save_notification": "true",
                "body": senderName + "has sent you a message!",
            });

            fetch(SEND_NOTIFICATION, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: notification
            }).
                then((response) => {
                    console.log('notif respons ', response)
                }).
                catch(error => {
                    console.log(error);
                });
        }
        this.setState({
            inputMessage: '',
            showButton: false,
        });
    }

    renderMessageItem = ({ item }) => {
        if (item) {
            const senderImage = item.senderImage;
            return (
                this.state.senderId != item.senderId
                    ?
                    item.type == 'text'
                        ?
                        <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                            <View style={styles.itemLeftChatContainer}>
                                <View style={styles.itemChatImageView}>
                                    <Image style={{ width: 20, height: 20, borderRadius: 100, alignItems: 'center' }}
                                        source={{ uri: senderImage }} />
                                </View>
                                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                        {item.textMessage}
                                    </Text>
                                    <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                        {this.convertTime(item && item.time)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        : null
                    :
                    item.type == 'text'
                        ?
                        <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-end', justifyContent: 'flex-end', alignItems: 'flex-end', }}>
                            <View style={styles.itemRightChatContainer}>
                                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'white' }}>
                                        {item.textMessage}
                                    </Text>
                                    <Text style={{
                                        fontSize: 8, color: 'black', textAlignVertical: 'center',
                                        color: 'white', marginRight: 5, marginTop: 4
                                    }}>
                                        {this.convertTime(item && item.time)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        : null
            )
        }
    }

    renderSeparator = () => {
        return (
            <View
                style={{ height: 5, width: '100%', }}>
            </View>
        );
    }

    render() {
        const { navigation: { state: { params: { providerImage } } } } = this.props
        const { showButton } = this.state;
        return (
            <KeyboardAvoidingView style={styles.container} behavior={ios ? 'padding' : null}>
                <StatusBarPlaceHolder />
                <ImageBackground style={styles.container}
                    source={require('../icons/bg_chat.png')}>

                    <View style={{
                        flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                        paddingLeft: 10, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                    }}>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center', }}
                                onPress={() => this.props.navigation.goBack()}>
                                <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                    source={require('../icons/arrow_back.png')} />
                            </TouchableOpacity>

                            <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 10 }}
                                source={{ uri: providerImage }} />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                                {this.state.receiverName + " "}{this.state.surname}
                            </Text>
                        </View>
                    </View>

                    <ScrollView ref={ref => this.scrollView = ref}
                        contentContainerStyle={{
                            justifyContent: 'center', alignItems: 'center',
                            alwaysBounceVertical: true
                        }}
                        keyboardShouldPersistTaps='handled'
                        keyboardDismissMode='on-drag'>

                        <View style={{ flexDirection: 'column', marginBottom: 45 }}>
                            <View style={styles.listView}>
                                <FlatList
                                    numColumns={1}
                                    data={this.state.dataChatSource}
                                    renderItem={this.renderMessageItem}
                                    keyExtractor={(item, index) => index.toString()}
                                    showsVerticalScrollIndicator={false}
                                    extraData={this.state}
                                    ItemSeparatorComponent={this.renderSeparator}
                                    ref={(ref) => { this.myFlatListRef = ref }}
                                    onContentSizeChange={() => { this.myFlatListRef.scrollToEnd({ animated: true }) }}
                                    onLayout={() => { this.myFlatListRef.scrollToEnd({ animated: true }) }} />
                            </View>
                        </View>
                    </ScrollView>
                    {this.state.isLoading && (
                        <View style={styles.loaderStyle}>
                            <ActivityIndicator
                                style={{ height: 80 }}
                                color="red"
                                size="large" />
                        </View>
                    )}
                    <View style={styles.footer}>
                        <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TextInput style={{ width: screenWidth - 90, fontSize: 16, marginLeft: 5, alignSelf: 'center' }}
                                placeholder='Tapez un message'
                                value={this.state.inputMessage}
                                multiline={true}
                                onChangeText={(inputMesage) => this.showHideButton(inputMesage)}>
                            </TextInput>
                            <TouchableOpacity disabled={!showButton} style={{ backgroundColor: !showButton ? inactiveBackground : buttonPrimary, height: 50, justifyContent: 'center', alignItems: 'center', alignContent: 'center', position: 'absolute', end: 0 }}
                                onPress={this.sendMessageTask}>
                                <Text style={{ alignSelf: 'center', fontWeight: 'bold', color: !showButton ? inactiveText : white, fontSize: 16, paddingLeft: 10, paddingRight: 10 }}>
                                    ENVOYER
                                    </Text>
                            </TouchableOpacity>
                        </View>
                        {this.state.isJobAccepted && (
                            <View style={{
                                flexDirection: 'column', width: screenWidth, height: 50, backgroundColor: 'white',
                                borderRadius: 2, alignItems: 'center', justifyContent: 'flex-start',
                            }}>
                                <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                                <TouchableOpacity style={styles.textViewDirection}
                                    onPress={() => this.props.navigation.navigate("MapDirection")}>
                                    <Image style={{ width: 20, height: 20, marginLeft: 20 }}
                                        source={require('../icons/mobile_gps.png')} />
                                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                                        Fournisseur de services de suivi
                                    </Text>
                                    <Image style={{ width: 20, height: 20, marginLeft: 20, position: "absolute", end: 0, marginRight: 15 }}
                                        source={require('../icons/right_arrow.png')} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ImageBackground>
            </KeyboardAvoidingView>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg,
    },
    listView: {
        flex: 1,
        padding: 5,
    },
    footer: {
        width: screenWidth,
        minHeight: 50,
        flexDirection: 'column',
        backgroundColor: 'white',
        justifyContent: 'center',
        position: 'absolute', //Footer
        bottom: 0, //Footer
    },
    itemLeftChatContainer: {
        maxWidth: (screenWidth / 2) + 30,
        flexDirection: 'row',
        backgroundColor: colorGray,
        padding: 10,
        borderRadius: 5,
        alignContent: 'center'
    },
    itemChatImageView: {
        width: 20,
        height: 20,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemRightChatContainer: {
        maxWidth: screenWidth / 2,
        flexDirection: 'row',
        backgroundColor: '#1E90FF',
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    textViewDirection: {
        flexDirection: 'row',
        width: screenWidth,
        height: 50,
        backgroundColor: 'white',
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 15,
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
        messagesInfo: state.messagesInfo,
        jobsInfo: state.jobsInfo,
        generalInfo: state.generalInfo,
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

export default connect(mapStateToProps, mapDispatchToProps)(ChatAfterBookingDetailsScreen);