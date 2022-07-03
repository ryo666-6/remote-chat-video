import * as constant from './constant.js'

let state = {
    socketId: null,
    localStream: null,
    remoteStream: null,
    screenSharingStream: null,
    allowConnectionFromStrangers: false,
    screenSharingActive: false,
    callState: constant.callState.CALL_AVAILABLE_ONLY_CHAT,
}

export const setSocketId = (socketId) => {
    state = {
        ...state,
        socketId,
    }
}

export const setLocalStream = (stream) => {
    state = {
        ...state,
        localStream: stream
    }
}

export const setAllowConnectionFromStrangers = (allowConnection) => {
    state = {
        ...state,
        allowConnectionFromStrangers: allowConnection
    }
}

export const setScreenSharingActive = (screenSharingActive) => {
    state = {
        ...state,
        screenSharingActive
    }
}

export const setScreenSharingStream = (stream) => {
    state = {
        ...state,
        screenSharingStream: stream
    }
}

export const setRemoteStream = (stream) => {
    state = {
        ...state,
        remoteStream: stream
    }
}

export const setCallState = (callState) => {
    state = {
        ...state,
        callState,
    }
}

export const getState = () => {
    return state;
}