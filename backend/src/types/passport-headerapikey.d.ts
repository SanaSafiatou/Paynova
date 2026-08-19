declare module 'passport-headerapikey' {
  import { Strategy } from 'passport';
  export class HeaderAPIKeyStrategy extends Strategy {
    constructor(options: { header: string; prefix?: string; passReqToCallback?: boolean }, verify: (...args: any[]) => any);
  }
  export { HeaderAPIKeyStrategy as Strategy };
}
