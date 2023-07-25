import { Injectable, Logger } from "@nestjs/common";
import { Observable, Subject } from "rxjs";

@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);
  private subject = new Subject<{ name: string; data: unknown }>();

  addEvent(eventName: string, eventData: unknown): void {
    this.logger.debug(`Event: ${eventName}`);
    this.subject.next({ name: eventName, data: eventData });
  }

  getEventSubject(): Observable<{ name: string; data: unknown }> {
    return this.subject.asObservable();
  }
}
