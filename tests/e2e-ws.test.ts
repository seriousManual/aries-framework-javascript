import { getBaseConfig } from '../packages/core/tests/helpers'

import { e2eTest } from './e2e-test'

import { Agent, WsOutboundTransporter, AutoAcceptCredential } from '@aries-framework/core'
import { WsInboundTransport } from '@aries-framework/node'

const recipientConfig = getBaseConfig('E2E WS Recipient ', {
  autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
})

const mediatorPort = 4000
const mediatorConfig = getBaseConfig('E2E WS Mediator', {
  endpoint: `ws://localhost:${mediatorPort}`,
  autoAcceptMediationRequests: true,
})

const senderPort = 4001
const senderConfig = getBaseConfig('E2E WS Sender', {
  endpoint: `ws://localhost:${senderPort}`,
  mediatorPollingInterval: 1000,
  autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
})

describe('E2E WS tests', () => {
  let recipientAgent: Agent
  let mediatorAgent: Agent
  let senderAgent: Agent

  beforeEach(async () => {
    recipientAgent = new Agent(recipientConfig.config, recipientConfig.agentDependencies)
    mediatorAgent = new Agent(mediatorConfig.config, mediatorConfig.agentDependencies)
    senderAgent = new Agent(senderConfig.config, senderConfig.agentDependencies)
  })

  afterEach(async () => {
    await recipientAgent.shutdown({ deleteWallet: true })
    await mediatorAgent.shutdown({ deleteWallet: true })
    await senderAgent.shutdown({ deleteWallet: true })
  })

  test('Full WS flow (connect, request mediation, issue, verify)', async () => {
    // Recipient Setup
    recipientAgent.setOutboundTransporter(new WsOutboundTransporter())
    await recipientAgent.initialize()

    // Mediator Setup
    mediatorAgent.setInboundTransporter(new WsInboundTransport({ port: mediatorPort }))
    mediatorAgent.setOutboundTransporter(new WsOutboundTransporter())
    await mediatorAgent.initialize()

    // Sender Setup
    senderAgent.setInboundTransporter(new WsInboundTransport({ port: senderPort }))
    senderAgent.setOutboundTransporter(new WsOutboundTransporter())
    await senderAgent.initialize()

    await e2eTest({
      mediatorAgent,
      senderAgent,
      recipientAgent,
    })
  })
})
