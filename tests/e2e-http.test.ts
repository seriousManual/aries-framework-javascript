import { getBaseConfig } from '../packages/core/tests/helpers'

import { e2eTest } from './e2e-test'

import { HttpOutboundTransporter, Agent, AutoAcceptCredential } from '@aries-framework/core'
import { HttpInboundTransport } from '@aries-framework/node'

const recipientConfig = getBaseConfig('E2E HTTP Recipient', {
  autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
})

const mediatorPort = 3000
const mediatorConfig = getBaseConfig('E2E HTTP Mediator', {
  endpoint: `http://localhost:${mediatorPort}`,
  autoAcceptMediationRequests: true,
})

const senderPort = 3001
const senderConfig = getBaseConfig('E2E HTTP Sender', {
  endpoint: `http://localhost:${senderPort}`,
  mediatorPollingInterval: 1000,
  autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
})

describe('E2E HTTP tests', () => {
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

  test('Full HTTP flow (connect, request mediation, issue, verify)', async () => {
    // Recipient Setup
    recipientAgent.setOutboundTransporter(new HttpOutboundTransporter())
    await recipientAgent.initialize()

    // Mediator Setup
    mediatorAgent.setInboundTransporter(new HttpInboundTransport({ port: mediatorPort }))
    mediatorAgent.setOutboundTransporter(new HttpOutboundTransporter())
    await mediatorAgent.initialize()

    // Sender Setup
    senderAgent.setInboundTransporter(new HttpInboundTransport({ port: senderPort }))
    senderAgent.setOutboundTransporter(new HttpOutboundTransporter())
    await senderAgent.initialize()

    await e2eTest({
      mediatorAgent,
      senderAgent,
      recipientAgent,
    })
  })
})
