import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from "../auth.service";

@Injectable({
  providedIn: 'root'
})
export class LoggedInAuthGuard implements CanActivate {

  constructor(
    private router: Router,
    public authenticationService: AuthService
  ) { }

  // Auth Guard for unauthenticated pages (session pages)
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

    const isAuthenticated = this.authenticationService.isAuthenticated();

    if (isAuthenticated === false) {
      // if user is logged in, then don't allow user to go back to a session pages
      return true;
    } else {
      this.router.navigate(['home']);
      return false;
    }

  }
}

