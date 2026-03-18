//===============================================================================
// © 2021 .Kritin Digital solutions  All rights reserved.
// Original Author: Aman Mishra
// Original Date: 7 June 2021
//==============================================================================
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { SpinnerService } from '../services/spinner.services';
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  count = 0;
  constructor(private spinner: SpinnerService) { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.spinner.show()

    this.count++;
    return next.handle(req).pipe(tap(
      event => //console.log('spin',event),
        ((error: any) => console.log(error))
    ), finalize(() => {
      this.count--;
      if (this.count == 0) this.spinner.hide()
    })
    );
  }
}
