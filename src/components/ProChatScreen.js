import React, { Component } from 'react';
import { connect } from 'react-redux';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { startFetchingMessages, messagesFetched, messagesError } from '../Redux/Actions/messageActions';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, ScrollView, TextInput, Dimensions,
    BackHandler, ActivityIndicator, ImageBackground, StatusBar, Platform,
    KeyboardAvoidingView, FlatList,
} from 'react-native';
import database from '@react-native-firebase/database';
import Config from './Config';
import { colorPrimary, colorPrimaryDark, colorGray, colorBg, inactiveBackground, buttonPrimary, inactiveText, white } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;
const SEND_NOTIFICATION = Config.baseURL + "notification/sendNotification";

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

const GET_IMAGE_URL = Config.baseURL + "thirdpartyapi/chatupload"

class ProChatScreen extends Component {
    constructor(props) {
        super()
        const {
            messagesInfo: { dataChatSource, fetched },
            navigation: { state: { params: { currentPos } } },
            jobsInfo: { allJobRequestsProviders, selectedJobRequest: { user_id } },
            navigation,
            userInfo: { providerDetails }
        } = props;
        this.state = {
            showButton: false,
            senderId: providerDetails.providerId,
            senderName: providerDetails.name + " " + providerDetails.surname,
            senderImage: providerDetails.imageSource,
            inputMessage: '',
            showButton: false,
            dataChatSource: dataChatSource[user_id] || [],
            isLoading: !fetched,
            //From ProDashboardScreen && ProMapDirection
            pageTitle: navigation.state.params.pageTitle,
            receiverId: allJobRequestsProviders[currentPos].user_id,
            receiverName: allJobRequestsProviders[currentPos].user_details.username,
            receiverImage: allJobRequestsProviders[currentPos].user_details.image,
            orderId: allJobRequestsProviders[currentPos].order_id,
            serviceName: allJobRequestsProviders[currentPos].service_details.service_name,
            userImageAvailable: allJobRequestsProviders[currentPos].imageAvailable,
            customer_FCM_id: allJobRequestsProviders[currentPos].user_details.fcm_id,
        };
    };

    componentDidMount() {
        const { navigation } = this.props;
        navigation.addListener('willFocus', async () => {
            this.reInit();
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    reInit = () => {
        const {
            messagesInfo: { dataChatSource, fetched },
            navigation: { state: { params: { currentPos } } },
            jobsInfo: { allJobRequestsProviders, selectedJobRequest: { user_id } },
            navigation,
            userInfo: { providerDetails }
        } = this.props;
        console.log('chat --');
        console.log(this.props);
        this.setState({
            showButton: false,
            senderId: providerDetails.providerId,
            senderName: providerDetails.name + " " + providerDetails.surname,
            senderImage: providerDetails.imageSource,
            inputMessage: '',
            showButton: false,
            dataChatSource: dataChatSource[user_id] || [],
            isLoading: !fetched,
            //From ProDashboardScreen && ProMapDirection
            pageTitle: navigation.state.params.pageTitle,
            receiverId: allJobRequestsProviders[currentPos].user_id,
            receiverName: allJobRequestsProviders[currentPos].user_details.username,
            receiverImage: allJobRequestsProviders[currentPos].user_details.image,
            orderId: allJobRequestsProviders[currentPos].order_id,
            serviceName: allJobRequestsProviders[currentPos].service_details.service_name,
            userImageAvailable: allJobRequestsProviders[currentPos].imageAvailable,
            customer_FCM_id: allJobRequestsProviders[currentPos].user_details.fcm_id,
        });
    }

    componentDidUpdate() {
        const { messagesInfo: { fetched, dataChatSource }, jobsInfo: { selectedJobRequest: { user_id } } } = this.props;
        const { isLoading } = this.state;
        const localDataChatSource = this.state.dataChatSource;
        if (fetched && isLoading)
            this.setState({ isLoading: false });
        var chatHistory = dataChatSource[user_id] === undefined ? [] : dataChatSource[user_id];
        if (JSON.stringify(chatHistory) !== JSON.stringify(localDataChatSource))
            this.setState({ dataChatSource: chatHistory });
    }

    handleBackButtonClick = () => {
        if (this.state.pageTitle === "ProMapDirection")
            this.props.navigation.navigate("ProMapDirection");
        else if (this.state.pageTitle === "ProDashboard")
            this.props.navigation.navigate("ProDashboard");
        else if (this.state.pageTitle === 'ProAllMessage')
            this.props.navigation.navigate("ProAllMessage");
        else
            this.props.navigation.goBack();
        return true;
    }

    convertTime = (time) => {
        let d = new Date(time);
        let c = new Date();
        let result = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':';
        result += (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        if (c.getDay() !== d.getDay()) {
            result = d.getDay() + '/' + d.getMonth() + "/" + d.getFullYear() + ', ' + result;
        }
        return result;
    }

    showHideButton = (input) => {
        this.setState({
            inputMessage: input,
        });
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
        const { inputMessage, senderId, senderName, senderImage, receiverId, receiverImage, customer_FCM_id, receiverName, serviceName, orderId } = this.state;
        this.setState({
            inputMessage: '',
            showButton: false,
        });
        if (inputMessage.length > 0) {
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
                "fcm_id": customer_FCM_id,
                "user_id": receiverId,
                "employee_id": senderId,
                "order_id": orderId,
                "type": "Message",
                "notification_by": "Employee",
                "title": "Message Recieved",
                "save_notification": "true",
                "body": senderName + "has sent you a message",
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
            return (
                this.state.senderId != item.senderId
                    ?
                    item.type == 'text'
                        ?
                        <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                            <View style={styles.itemLeftChatContainer}>
                                <View style={styles.itemChatImageView}>
                                    <Image style={{ width: 20, height: 20, borderRadius: 100, alignItems: 'center' }}
                                        source={{ uri: item.senderImage }} />
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
                                    <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', color: 'white', marginLeft: 5 }}>
                                        {item && this.convertTime(item.time)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        : null
            )
        }
        return
    }

    renderSeparator = () => {
        return (
            <View
                style={{ height: 5, width: '100%', }}>
            </View>
        );
    }

    render() {
        let { showButton } = this.state;
        return (
            <KeyboardAvoidingView style={styles.container} behavior={ios ? 'padding' : null}>
                <StatusBarPlaceHolder />
                <ImageBackground style={styles.subContainer}
                    source={require('../icons/bg_chat.png')}>
                    <View style={{
                        flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                        paddingLeft: 20, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                    }}>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TouchableOpacity style={{ width: 20, height: 20, alignSelf: 'center' }}
                                onPress={() => this.state.pageTitle == 'ProMapDirection' ? this.props.navigation.navigate("ProMapDirection") : this.props.navigation.navigate("ProDashboard")}>
                                <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                    source={require('../icons/arrow_back.png')} />
                            </TouchableOpacity>

                            <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 20 }}
                                source={{ uri: this.state.receiverImage }} />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                                {this.state.receiverName}
                            </Text>
                        </View>
                    </View>

                    <ScrollView ref={ref => this.scrollView = ref}
                        onContentSizeChange={(contentWidth, contentHeight) => {
                            this.scrollView.scrollToEnd({ animated: true })
                        }}
                        contentContainerStyle={{ overflow: 'hidden', }}>

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
                                    onContentSizeChange={() => { 
                                        this.myFlatListRef.scrollToEnd({ animated: true });
                                     }}
                                    onLayout={() => { this.myFlatListRef.scrollToEnd({ animated: true }) }} />
                            </View>
                        </View>
                    </ScrollView>
                    {this.state.isLoading && (
                        <View style={styles.loaderStyle}>
                            <ActivityIndicator
                                style={{ height: 80 }}
                                color="#C00"
                                size="large" />
                        </View>
                    )}
                    <View style={styles.footer}>
                        <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TextInput style={{ width: screenWidth - 90, fontSize: 16, marginLeft: 5, alignSelf: 'center' }}
                                placeholder='Type a message'
                                value={this.state.inputMessage}
                                multiline={true}
                                onChangeText={(inputMesage) => this.showHideButton(inputMesage)}>
                            </TextInput>

                            {/*<TouchableOpacity style={{
                                    height: 50, justifyContent: 'center', alignItems: 'center',
                                    alignContent: 'center', marginRight: 25
                                }}
                                    onPress={this.selectPhoto.bind(this)}>
                                    <Image style={{ width: 20, height: 20 }}
                                        source={require('../icons/camera.png')} />
                                </TouchableOpacity>*/}
                            <TouchableOpacity disabled={!showButton} style={{ backgroundColor: !showButton ? inactiveBackground : buttonPrimary, height: 50, justifyContent: 'center', alignItems: 'center', alignContent: 'center', position: 'absolute', end: 0 }}
                                onPress={this.sendMessageTask}>
                                <Text style={{ alignSelf: 'center', fontWeight: 'bold', color: !showButton ? inactiveText : white, fontSize: 16, paddingLeft: 10, paddingRight: 10 }}>
                                    ENVOYER
                                    </Text>
                            </TouchableOpacity>
                        </View>
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
    subContainer: {
        backgroundColor: 'yellow',
        flex: 1
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
        marginBottom: 0,
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
        jobsInfo: state.jobsInfo,
        messagesInfo: state.messagesInfo,
        generalInfo: state.generalInfo,
        userInfo: state.userInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchMessages: () => {
            dispatch(startFetchingMessages());
        },
        fetchedMessages: data => {
            dispatch(messagesFetched(data));
        },
        fetchingMessagesError: error => {
            dispatch(messagesError(error));
        },
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

export default connect(mapStateToProps, mapDispatchToProps)(ProChatScreen);