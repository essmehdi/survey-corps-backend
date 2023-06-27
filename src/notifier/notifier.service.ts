import { Injectable } from "@nestjs/common";
import { Observable, Subject } from "rxjs";

@Injectable()
export class NotifierService {
  private subject = new Subject<{ name: string; data: unknown }>();

  addEvent(eventName: string, eventData: unknown): void {
    this.subject.next({ name: eventName, data: eventData });
  }

  getEventSubject(): Observable<{ name: string; data: unknown }> {
    return this.subject.asObservable();
  }
}
