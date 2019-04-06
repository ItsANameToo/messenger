'use strict'

const axios = require("axios")

exports.plugin = {
    pkg: require('../package.json'),
    defaults: {
        enabled: false,
        delegates: [],
        events: {
            vote: [],
            unvote: [],
            missed: []
        },
        webhooks: {
            slack: {
                url: '',
                field: 'text',
                type: 'slack'
            },
            discord: {
                url: '',
                field: 'context',
                type: 'discord'
            }
        }
    },
    async register (container, options) {
        const logger = container.resolvePlugin('logger')

        if (!options.enabled) {
            logger.info('[MESSENGER] I am currently disabled, make sure to enable me in your plugins.js config if you need me!')
            return
        }

        const emitter = container.resolvePlugin('event-emitter')
        const dbService = container.resolvePlugin('database')

        // You can set a custom explorer url by specifying it in the config
        let explorerUrl = options.explorer || 'https://explorer.ark.io'

        const messages = {
            discord: {
                'vote': (address, username, balance, id) => {
                    return `⬆️ **${address}** voted for **${username}** with **${balance} ARK**. [Open transaction](${explorerUrl}/transaction/${id})`
                },
                'unvote': (address, username, balance, id) => {
                    return `⬇️ **${address}** unvoted **${username}** with **${balance} ARK**. [Open transaction](${explorerUrl}/transaction/${id})`
                },
                'missed': (username) => {
                    return `**${username}** missed a block`
                }
            },
            slack: {
                'vote': (address, username, balance, id) => {
                    return `⬆️ *${address}* voted for *${username}* with *${balance} ARK*. <${explorerUrl}/transaction/${id}|Open transaction>`
                },
                'unvote': (address, username, balance, id) => {
                    return `⬇️ *${address}* unvoted *${username}* with *${balance} ARK*. <${explorerUrl}/transaction/${id}|Open transaction>`
                },
                'missed': (username) => {
                    return `*${username}* missed a block`
                }
            },
            default: {
                'vote': (address, username, balance, id) => {
                    return `⬆️ ${address} voted for ${username} with ${balance} ARK. ${explorerUrl}/transaction/${id}`
                },
                'unvote': (address, username, balance, id) => {
                    return `⬇️ ${address} unvoted ${username} with ${balance} ARK. ${explorerUrl}/transaction/${id}`
                },
                'missed': (username) => {
                    return `${username} missed a block`
                }
            }
        }

        logger.info('[MESSENGER] Reporting for duty! I\'ll keep you informed about votes, unvotes and missed blocks!')

        if (options.events.vote.length > 0) {
            emitter.on('wallet.vote', async data => {
                const tx = data.transaction
                const delegatePubKey = tx.asset.votes[0].slice(1)
                const delegate = dbService.walletManager.findByPublicKey(delegatePubKey)
                const voter = dbService.walletManager.findByPublicKey(tx.senderPublicKey)
                const balance = parseFloat(voter.balance / 1e8).toFixed(2)

                if (!options.delegates.length || options.delegates.includes(delegate.username)) {
                    const hooks = options.events.vote
                    for (let i = 0; i < hooks.length; i++) {
                        const webhook = options.webhooks[hooks[i]]
                        const webhookType = webhook.type || 'default'
                        const payload = {}
                        payload[webhook.field] = messages[webhookType]['vote'](voter.address, delegate.username, balance, tx.id)
                        axios.post(webhook.url, payload)
                    }
                }
            })
        }

        if (options.events.unvote.length > 0) {
            emitter.on('wallet.unvote', async data => {
                const tx = data.transaction
                const delegatePubKey = tx.asset.votes[0].slice(1)
                const delegate = dbService.walletManager.findByPublicKey(delegatePubKey)
                const voter = dbService.walletManager.findByPublicKey(tx.senderPublicKey)
                const balance = parseFloat(voter.balance / 1e8).toFixed(2)

                if (!options.delegates.length || options.delegates.includes(delegate.username)) {
                    const hooks = options.events.unvote
                    for (let i = 0; i < hooks.length; i++) {
                        const webhook = options.webhooks[hooks[i]]
                        const webhookType = webhook.type || 'default'
                        const payload = {}
                        payload[webhook.field] = messages[webhookType]['unvote'](voter.address, delegate.username, balance, tx.id)
                        axios.post(webhook.url, payload)
                    }
                }
            })
        }

        if (options.events.missed.length > 0) {
            emitter.on('forger.missing', async data => {
                const delegate = data.delegate
                if (!options.delegates.length || options.delegates.includes(delegate.username)) {
                    const hooks = options.events.missing
                    for (let i = 0; i < hooks.length; i++) {
                        const webhook = options.webhooks[hooks[i]]
                        const webhookType = webhook.type || 'default'
                        const payload = {}
                        payload[webhook.field] = messages[webhookType]['missing'](delegate.username)
                        axios.post(webhook.url, payload)
                    }
                }
            })
        }
    }
}