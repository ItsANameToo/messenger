# Simple Messenger

> Sends you a message when a vote, unvote or missed block occurs

Inspired by the [notifier plugin](https://github.com/deadlock-delegate/notifier) of delegate deadlock!

## Installation

### Clone

```bash
yarn global add @itsanametoo/messenger
```

### Register Plugin

Edit the plugin config file located at:

`~/.config/ark-core/{mainnet|devnet|testnet}/plugins.js`

Add the following snippet to the end of the file (or at least after `core-p2p` gets included):

```javascript
module.exports = {
    '@arkecosystem/core-event-emitter': {},
    ...
    // Snippet to add
    '@itsanametoo/messenger': {
        enabled: true, // Enables the plugin, default value is false
        delegates: ['exampleDelegate', 'exampleDelegate2'] // A list of delegate names to track, leave it empty if you want to receive messages for every delegate
        events: {
            vote: ['slack', 'discord'], // List which webhooks should be triggered if the event occurs
            unvote: ['discord'],
            missed: ['discord2']
        },
        webhooks: { // Define different webhooks that can be linked to events
            slack: {
                url: 'a slack webhook url',
                field: 'text',
                type: 'slack'
            },
            discord: {
                url: 'a discord webhook url',
                field: 'content',
                type: 'discord'
            },
            discord2: {
                url: 'a different discord webhook url',
                field: 'content',
                type: 'discord'
            }
        }
}
```

You need to configure the above snippet to match your own needs.
An example snippet to sends messages for all three events on `discord` when they apply to delegate `itsanametoo`, would look as follows:

```javascript
'@itsanametoo/messenger': {
    enabled: true,
    delegates: ['itsanametoo'],
    events: {
        vote: ['discord'],
        unvote: ['discord'],
        missed: ['discord']
    },
    webhooks: {
        discord: {
            url: 'https://discordapp.com/api/webhooks/some-webhook-url',
            field: 'content',
            type: 'discord'
        }
    }
}
```

You can add as many webhooks as you need and give them whatever name you want.
You only have to make sure that the webhook names you use for the different `events` in the config match with the ones you've listed under `webhooks`.
The `field` property is used as key to send the data to your specified webhook; for Slack you need to use `text` and for Discord it's `content`.
Don't forget to specify the type of the webhook too, which can either be `slack` or `discord`.
If you use a different service to post your webhook too, then simply omit the whole `type` property.

### Enabling

Before the plugin will be picked up by the core implementation, you need to restart the process.
The easiest way to achieve this is by running the `pm2 restart all` command.
Afterwards you can check if everything is running fine again with the `pm2 logs` command.

If the plugin is enabled, it will show a logline prefixed with `[MESSENGER]` during startup.

### Testing

The easiest way to test if the notifications work, is by having an address vote / unvote the delegate(s) you want to be notified of.

## Credits

- [ItsANameToo](https://github.com/itsanametoo)
- [All Contributors](../../contributors)

## License

[MIT](LICENSE) © ItsANameToo
