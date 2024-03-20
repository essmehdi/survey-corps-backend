import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { FormConfigService } from "../form/config/config.service";
import { Server, Socket } from "socket.io";
import { Logger, OnApplicationShutdown } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Subscription } from "rxjs";
import { NotifierService } from "./notifier.service";

/**
 * This websocket is mainly used to notify the users who are connected
 * to the dashboard that an edit has occured to refresh their data
 * to avoid conflicts
 *
 * @see FormModule
 */
@WebSocketGateway()
export class NotifierGateway implements OnGatewayInit, OnApplicationShutdown {
  private readonly logger = new Logger(NotifierGateway.name);
  private eventSubscription: Subscription;

  @WebSocketServer()
  server: Server;

  constructor(private notifierService: NotifierService) {}

  /**
   * Subscribes to the events on the NotifierService and send them to connected clients
   */
  afterInit() {
    this.eventSubscription = this.notifierService.getEventSubject().subscribe({
      next: (event) => {
        this.server.emit(event.name, event.data);
      }
    });
  }

  onApplicationShutdown() {
    this.eventSubscription.unsubscribe();
  }
}
