import { Test, type TestingModule } from "@nestjs/testing"
import { StarkNetEventListener } from "../services/starknet-event.listener"
import { OrderService } from "../services/order.service"
import {
  STARKNET_PROVIDER,
  type PaymentConfirmedEvent,
  type StarkNetProvider,
} from "../interfaces/starknet-provider.interface"
import { OrderStatus } from "../entities/order.entity"
import { jest } from "@jest/globals"

describe("StarkNetEventListener", () => {
  let listener: StarkNetEventListener
  let orderService: OrderService
  let starkNetProvider: StarkNetProvider
  let mockListenCallback: (event: PaymentConfirmedEvent) => void

  const mockOrderService = {
    findOrderByOrderId: jest.fn(),
    updateOrderStatus: jest.fn(),
  }

  const mockStarkNetProvider = {
    listenForPaymentConfirmedEvents: jest.fn((cb) => {
      mockListenCallback = cb
    }),
    stopListening: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StarkNetEventListener,
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: STARKNET_PROVIDER,
          useValue: mockStarkNetProvider,
        },
      ],
    }).compile()

    listener = module.get<StarkNetEventListener>(StarkNetEventListener)
    orderService = module.get<OrderService>(OrderService)
    starkNetProvider = module.get<StarkNetProvider>(STARKNET_PROVIDER)

    // Manually call onModuleInit to trigger listener setup
    listener.onModuleInit()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should be defined", () => {
    expect(listener).toBeDefined()
  })

  it("should start listening for events on module init", () => {
    expect(mockStarkNetProvider.listenForPaymentConfirmedEvents).toHaveBeenCalledTimes(1)
  })

  it("should process a new PaymentConfirmedEvent and update order status", async () => {
    const event: PaymentConfirmedEvent = {
      transactionHash: "0xnewTxHash123",
      orderId: "order-abc-123",
      amount: "50.00",
      currency: "ETH",
      recipientAddress: "0x123...",
      blockNumber: 100,
      timestamp: new Date(),
    }

    const mockOrder = {
      id: "uuid-1",
      orderId: "order-abc-123",
      paymentAmount: "50.00",
      currencySymbol: "ETH",
      status: OrderStatus.PENDING,
      transactionHash: null,
    }

    mockOrderService.findOrderByOrderId.mockResolvedValue(mockOrder)
    mockOrderService.updateOrderStatus.mockResolvedValue({
      ...mockOrder,
      status: OrderStatus.PAID,
      transactionHash: event.transactionHash,
    })

    // Simulate the provider emitting an event
    await mockListenCallback(event)

    expect(orderService.findOrderByOrderId).toHaveBeenCalledWith(event.orderId)
    expect(orderService.updateOrderStatus).toHaveBeenCalledWith(event.orderId, {
      status: OrderStatus.PAID,
      transactionHash: event.transactionHash,
      paymentMetadata: { blockchainEvent: event },
    })
    expect(mockOrderService.updateOrderStatus).toHaveBeenCalledTimes(1)
  })

  it("should not update order if not found", async () => {
    const event: PaymentConfirmedEvent = {
      transactionHash: "0xnewTxHash456",
      orderId: "non-existent-order",
      amount: "10.00",
      currency: "ETH",
      recipientAddress: "0x456...",
      blockNumber: 101,
      timestamp: new Date(),
    }

    mockOrderService.findOrderByOrderId.mockResolvedValue(null)

    await mockListenCallback(event)

    expect(orderService.findOrderByOrderId).toHaveBeenCalledWith(event.orderId)
    expect(orderService.updateOrderStatus).not.toHaveBeenCalled()
  })

  it("should not update order if already paid with the same transaction hash", async () => {
    const event: PaymentConfirmedEvent = {
      transactionHash: "0xexistingTxHash",
      orderId: "order-paid-1",
      amount: "100.00",
      currency: "ETH",
      recipientAddress: "0x789...",
      blockNumber: 102,
      timestamp: new Date(),
    }

    const mockPaidOrder = {
      id: "uuid-2",
      orderId: "order-paid-1",
      paymentAmount: "100.00",
      currencySymbol: "ETH",
      status: OrderStatus.PAID,
      transactionHash: "0xexistingTxHash",
    }

    mockOrderService.findOrderByOrderId.mockResolvedValue(mockPaidOrder)

    await mockListenCallback(event)

    expect(orderService.findOrderByOrderId).toHaveBeenCalledWith(event.orderId)
    expect(orderService.updateOrderStatus).not.toHaveBeenCalled()
  })

  it("should handle payment amount/currency mismatch", async () => {
    const event: PaymentConfirmedEvent = {
      transactionHash: "0xnewTxHash789",
      orderId: "order-mismatch",
      amount: "50.00", // Mismatch
      currency: "ETH",
      recipientAddress: "0xabc...",
      blockNumber: 103,
      timestamp: new Date(),
    }

    const mockOrder = {
      id: "uuid-3",
      orderId: "order-mismatch",
      paymentAmount: "60.00", // Expected
      currencySymbol: "ETH",
      status: OrderStatus.PENDING,
      transactionHash: null,
    }

    mockOrderService.findOrderByOrderId.mockResolvedValue(mockOrder)

    await mockListenCallback(event)

    expect(orderService.findOrderByOrderId).toHaveBeenCalledWith(event.orderId)
    expect(orderService.updateOrderStatus).not.toHaveBeenCalled() // Should not update due to mismatch
  })

  it("should handle errors during order update", async () => {
    const event: PaymentConfirmedEvent = {
      transactionHash: "0xerrorTxHash",
      orderId: "order-error",
      amount: "20.00",
      currency: "ETH",
      recipientAddress: "0xdef...",
      blockNumber: 104,
      timestamp: new Date(),
    }

    const mockOrder = {
      id: "uuid-4",
      orderId: "order-error",
      paymentAmount: "20.00",
      currencySymbol: "ETH",
      status: OrderStatus.PENDING,
      transactionHash: null,
    }

    mockOrderService.findOrderByOrderId.mockResolvedValue(mockOrder)
    mockOrderService.updateOrderStatus.mockRejectedValue(new Error("Database error"))

    await mockListenCallback(event)

    expect(orderService.findOrderByOrderId).toHaveBeenCalledWith(event.orderId)
    expect(orderService.updateOrderStatus).toHaveBeenCalledWith(event.orderId, expect.any(Object))
    // Expect error to be logged, but not re-thrown to stop the listener
  })
})
