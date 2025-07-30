import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { PaymentRetryService } from "../services/payment-retry.service"
import { PaymentRetryQueue, PaymentStatus } from "../entities/payment-retry-queue.entity"
import { NotificationService } from "../services/notification.service"
import { BlockchainService } from "../interfaces/blockchain-service.interface"
import { jest } from "@jest/globals" // Import jest to declare it

describe("PaymentRetryService", () => {
  let service: PaymentRetryService
  let repository: Repository<PaymentRetryQueue>
  let blockchainService: BlockchainService
  let notificationService: NotificationService

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  }

  const mockBlockchainService = {
    sendTransaction: jest.fn(),
    getTransactionStatus: jest.fn(),
  }

  const mockNotificationService = {
    sendPaymentFailureNotification: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRetryService,
        {
          provide: getRepositoryToken(PaymentRetryQueue),
          useValue: mockRepository,
        },
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile()

    service = module.get<PaymentRetryService>(PaymentRetryService)
    repository = module.get<Repository<PaymentRetryQueue>>(getRepositoryToken(PaymentRetryQueue))
    blockchainService = module.get<BlockchainService>(BlockchainService)
    notificationService = module.get<NotificationService>(NotificationService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("createPaymentRetry", () => {
    it("should create a new payment retry record", async () => {
      const createDto = {
        idempotencyKey: "test-key-001",
        userId: "user-123",
        userEmail: "test@example.com",
        paymentAmount: "100.50",
        currencySymbol: "ETH",
        recipientAddress: "0x123...",
      }

      const mockPayment = { id: "1", ...createDto }

      mockRepository.findOne.mockResolvedValue(null)
      mockRepository.create.mockReturnValue(mockPayment)
      mockRepository.save.mockResolvedValue(mockPayment)

      const result = await service.createPaymentRetry(createDto)

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { idempotencyKey: createDto.idempotencyKey },
      })
      expect(mockRepository.create).toHaveBeenCalled()
      expect(mockRepository.save).toHaveBeenCalled()
      expect(result).toEqual(mockPayment)
    })

    it("should return existing payment if idempotency key already exists", async () => {
      const createDto = {
        idempotencyKey: "test-key-001",
        userId: "user-123",
        userEmail: "test@example.com",
        paymentAmount: "100.50",
        currencySymbol: "ETH",
        recipientAddress: "0x123...",
      }

      const existingPayment = { id: "1", ...createDto }

      mockRepository.findOne.mockResolvedValue(existingPayment)

      const result = await service.createPaymentRetry(createDto)

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { idempotencyKey: createDto.idempotencyKey },
      })
      expect(mockRepository.create).not.toHaveBeenCalled()
      expect(result).toEqual(existingPayment)
    })
  })

  describe("processPaymentRetries", () => {
    it("should process pending payments successfully", async () => {
      const mockPayments = [
        {
          id: "1",
          idempotencyKey: "test-001",
          retryCount: 0,
          maxRetryAttempts: 3,
          recipientAddress: "0x123...",
          paymentAmount: "100",
          currencySymbol: "ETH",
        },
      ]

      mockRepository.find.mockResolvedValue(mockPayments)
      mockRepository.update.mockResolvedValue({ affected: 1 })
      mockBlockchainService.sendTransaction.mockResolvedValue({
        success: true,
        transactionHash: "0xabc123...",
      })

      await service.processPaymentRetries()

      expect(mockRepository.find).toHaveBeenCalled()
      expect(mockBlockchainService.sendTransaction).toHaveBeenCalled()
      expect(mockRepository.update).toHaveBeenCalledWith("1", {
        status: PaymentStatus.COMPLETED,
        transactionHash: "0xabc123...",
        completedAt: expect.any(Date),
        lastErrorMessage: null,
        errorDetails: null,
      })
    })

    it("should handle failed payments and schedule retries", async () => {
      const mockPayments = [
        {
          id: "1",
          idempotencyKey: "test-001",
          retryCount: 0,
          maxRetryAttempts: 3,
          recipientAddress: "0x123...",
          paymentAmount: "100",
          currencySymbol: "ETH",
        },
      ]

      mockRepository.find.mockResolvedValue(mockPayments)
      mockRepository.update.mockResolvedValue({ affected: 1 })
      mockBlockchainService.sendTransaction.mockResolvedValue({
        success: false,
        error: "Network timeout",
        errorDetails: { code: "TIMEOUT" },
      })

      await service.processPaymentRetries()

      expect(mockRepository.update).toHaveBeenCalledWith("1", {
        status: PaymentStatus.FAILED,
        retryCount: 1,
        lastErrorMessage: "Network timeout",
        errorDetails: { code: "TIMEOUT" },
        nextRetryAt: expect.any(Date),
      })
    })

    it("should exhaust payments after max retries and send notification", async () => {
      const mockPayments = [
        {
          id: "1",
          idempotencyKey: "test-001",
          retryCount: 2,
          maxRetryAttempts: 3,
          recipientAddress: "0x123...",
          paymentAmount: "100",
          currencySymbol: "ETH",
          userEmail: "test@example.com",
          userId: "user-123",
          notificationSent: false,
        },
      ]

      mockRepository.find.mockResolvedValue(mockPayments)
      mockRepository.update.mockResolvedValue({ affected: 1 })
      mockBlockchainService.sendTransaction.mockResolvedValue({
        success: false,
        error: "Persistent failure",
      })
      mockNotificationService.sendPaymentFailureNotification.mockResolvedValue(undefined)

      await service.processPaymentRetries()

      expect(mockRepository.update).toHaveBeenCalledWith("1", {
        status: PaymentStatus.EXHAUSTED,
        retryCount: 3,
        lastErrorMessage: "Persistent failure",
        errorDetails: undefined,
        exhaustedAt: expect.any(Date),
        nextRetryAt: null,
      })

      expect(mockNotificationService.sendPaymentFailureNotification).toHaveBeenCalledWith(
        "test@example.com",
        "user-123",
        "100",
        "ETH",
        "Persistent failure",
        "test-001",
      )
    })
  })

  describe("getPaymentStats", () => {
    it("should return payment statistics", async () => {
      mockRepository.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(5) // processing
        .mockResolvedValueOnce(70) // completed
        .mockResolvedValueOnce(10) // failed
        .mockResolvedValueOnce(5) // exhausted

      const stats = await service.getPaymentStats()

      expect(stats).toEqual({
        total: 100,
        pending: 10,
        processing: 5,
        completed: 70,
        failed: 10,
        exhausted: 5,
      })
    })
  })
})
