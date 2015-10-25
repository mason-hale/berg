ServiceConfiguration.configurations.upsert(
    { service: "facebook" },
        {
            $set: {
                appId: "734087940021015",
                loginStyle: "redirect",
                secret: "403a8f1e4670d86d6dc9b530f9fb5f95",
                requestPermissions: ['user_friends'],
        }
    }
);