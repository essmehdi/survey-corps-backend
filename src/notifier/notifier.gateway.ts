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

@WebSocketGateway()
export class NotifierGateway implements OnGatewayInit, OnApplicationShutdown {
  private readonly logger = new Logger(NotifierGateway.name);
  private eventSubscribtion: Subscription;

  @WebSocketServer()
  server: Server;

  constructor(private notifierService: NotifierService) {}

  afterInit(server: Server) {
    this.eventSubscribtion = this.notifierService.getEventSubject().subscribe({
      next: (event) => {
        this.server.emit(event.name, event.data);
      }
    });
  }

  onApplicationShutdown() {
    this.eventSubscribtion.unsubscribe();
  }
}
