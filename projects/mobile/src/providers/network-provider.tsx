import React, { createContext, useContext, useEffect, useState } from "react";

import * as Network from "expo-network";
import { NetworkStateEvent } from "expo-network";

type NetworkState = {
    isConnected: boolean;
};

const NetworkContext = createContext<NetworkState>({
    isConnected: true,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }: React.PropsWithChildren) => {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        let subscription: { remove: () => any };

        const subscribeToNetworkChanges = async () => {
            const state = await Network.getNetworkStateAsync();
            updateConnection(state);

            subscription = Network.addNetworkStateListener(updateConnection);
        };

        const updateConnection = (state: NetworkStateEvent) => {
            const connected = state.isConnected && state.isInternetReachable === true;
            setIsConnected(connected === undefined ? false : connected);
        };

        subscribeToNetworkChanges();

        return () => {
            subscription && subscription.remove();
        };
    }, []);

    return <NetworkContext.Provider value={{ isConnected }}>{children}</NetworkContext.Provider>;
};
