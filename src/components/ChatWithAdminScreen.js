import React, { Component } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, ScrollView, TextInput, Dimensions,
    BackHandler, ImageBackground, StatusBar, Platform, KeyboardAvoidingView
} from 'react-native';
import { connect } from 'react-redux';
import database from '@react-native-firebase/database';
import { colorPrimary, colorPrimaryDark, colorBg, colorGray, inactiveBackground, buttonPrimary, inactiveText, white } from '../Constants/colors';
import Config from './Config';

const screenWidth = Dimensions.get('window').width;
//const screenHeight = Dimensions.get('window').height;

const options = {
    title: 'Select a photo',
    takePhotoButtonTitle: 'Take a photo',
    chooseFromLibraryButtonTitle: 'Choose from gallery',
    quality: 1
};

const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;
const GET_IMAGE_URL = Config.baseURL + "thirdpartyapi/chatupload";

function StatusBarPlaceHolder() {
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

class ChatWithAdminScreen extends Component {

    constructor(props) {
        super();
        const { userInfo: { userDetails, providerDetails } } = props;
        const senderId = providerDetails.providerId || userDetails.userId;
        const senderName = providerDetails.name || userDetails.username;
        const senderImage = providerDetails.imageSource || userDetails.image;
        this.state = {
            senderId: senderId,
            senderName: senderName,
            senderImage: senderImage,
            inputMessage: '',
            showButton: false,
            dataChatSource: [],
            isLoading: true,
            isUploading: false,
            receiverId: "1",
            receiverName: "Admin",
            receiverImage: require('../images/generic_avatar.png'),
        };
    };

    componentWillMount() {
        const { navigation } = this.props;
        navigation.addListener('willFocus', async () => {
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        database().ref('adminChatting').child(this.state.senderId).child(this.state.receiverId)
            .on('child_added', value => {
                this.setState(prevState => {
                    //filter out only unique messages
                    let newData = [...prevState.dataChatSource];
                    if (value.val())
                        newData.push(value.val());
                    const uniqueData = Array.from(new Set(newData.map(a => a ? a.time : null)))
                        .map(time => {
                            return newData.find(a => a ? a.time === time : null)
                        });
                    return {
                        dataChatSource: [...uniqueData],
                        isLoading: false,
                    }
                })
            });

        this.setState({
            isLoading: false
        })
    }

    handleBackButtonClick = () => {
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
        if (this.state.inputMessage.length > 0) {
            let msgId = database().ref('adminChatting').child(this.state.senderId).child(this.state.receiverId).push().key;
            let updates = {};
            let recentUpdates = {};
            let message = {
                textMessage: this.state.inputMessage,
                imageMessage: '',
                time: database.ServerValue.TIMESTAMP,
                senderId: this.state.senderId,
                senderImage: this.state.senderImage,
                senderName: this.state.senderName,
                receiverId: this.state.receiverId,
                receiverName: this.state.receiverName,
                receiverImage: this.state.receiverImage,
                type: "text",
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
            }
            let recentMessage = {
                textMessage: this.state.inputMessage,
                imageMessage: '',
                time: database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: this.state.senderId,
                name: this.state.senderName,
                image: this.state.senderImage,
                type: "text",
            }

            updates['adminChatting/' + this.state.senderId + '/' + this.state.receiverId + '/' + msgId] = message;
            updates['adminChatting/' + this.state.receiverId + '/' + this.state.senderId + '/' + msgId] = message;
            database().ref().update(updates);

            recentUpdates['recentChatAdmin/' + this.state.receiverId + '/' + this.state.senderId + '/' + msgId] = recentMessage;
            database().ref().update(recentUpdates);

            this.setState({ inputMesage: '' });
        }

        this.setState({
            inputMessage: '',
            showButton: false,
        });
    }

    renderMessageItem = (item, index) => {
        const senderImage = item.senderImage;
        return (
            this.state.senderId != item.senderId
                ?
                item.type == 'text'
                    ?
                    <View key={index} style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                        <View style={styles.itemLeftChatContainer}>
                            <View style={styles.itemChatImageView}>
                                <Image style={{ width: 20, height: 20, borderRadius: 100, alignItems: 'center' }}
                                    source={senderImage ? { uri: senderImage } : require('../images/generic_avatar.png')} />
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
                    <View key={index} style={{ width: screenWidth, flex: 1, alignContent: 'flex-end', justifyContent: 'flex-end', alignItems: 'flex-end', }}>
                        <View style={styles.itemRightChatContainer}>
                            <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'white' }}>
                                    {item.textMessage}
                                </Text>
                                <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', color: 'white', marginLeft: 5 }}>
                                    {this.convertTime(item && item.time)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    : null
        )
    }

    renderSeparator = () => {
        return (
            <View
                style={{ height: 5, width: '100%', }}>
            </View>
        );
    }

    render() {
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

                            <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 10, }}
                                source={this.state.receiverImage} />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 10 }}>
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
                                {this.state.dataChatSource.map(this.renderMessageItem)}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TextInput style={{ width: screenWidth - 90, fontSize: 16, marginLeft: 5, alignSelf: 'center' }}
                                placeholder='Type a message'
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
                    </View>
                </ImageBackground>
            </KeyboardAvoidingView>
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
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatWithAdminScreen);

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
