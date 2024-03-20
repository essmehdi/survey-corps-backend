import { Injectable, Logger } from "@nestjs/common";
import { Observable, Subject } from "rxjs";

@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);
  /**
   * An RxJS subject used to track events
   * Its main purpose is for the WebSocket gateway to track to send
   * the events through WebSocket
   */
  private subject = new Subject<{ name: string; data: unknown }>();

  /**
   * Add an event to the RxJS {@link subject}
   * @param eventName Name of the event
   * @param eventData Data that should be sent with the event
   */
  addEvent(eventName: string, eventData: unknown): void {
    this.subject.next({ name: eventName, data: eventData });
  }

  /**
   * Returns the {@link subject} as an observable
   */
  getEventSubject(): Observable<{ name: string; data: unknown }> {
    return this.subject.asObservable();
  }
}
