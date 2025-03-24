import { Request, Response, NextFunction } from "express";


export function baseUrl( req: Request ) {
    return (req.protocol + "://" + req.get('host')).toLowerCase();
}

type AsyncMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncMiddleware) => function( req: Request, res: Response, next: NextFunction ) {
    const fnReturn = fn(req,res,next)
    return Promise.resolve(fnReturn).catch( err => {
        signalError(req,res,err);
    });
}

function errorCodeToStatusCode( code: any ) {
    if( !code || !Array.isArray(code) )
        return 500;
    const parts = code as any[];
    if( parts.length === 0 || parts.some(e=>Number.isFinite(e) !== true) )
        return 500;

    let result = parts[0]*100;
    if( parts.length > 1 )
        result += parts[1];

    return result;
}

// Use this method when we have an Error object
function signalError( req: Request, res: Response, err:any ) {
    const { code, name, message, stack } = err;
    const failure = {
        code,
        message: message ?? name,
        details: stack?.split(/\n/).map((e:string)=>e.trim()).slice(0,3)
    }
    log(req,failure,err);
    res.status( errorCodeToStatusCode(code) ).json({ failure });
}

function log( req: Request, failure: any, err?: any ) {
    const auth = (req as any).auth;
    console.error( 'ERROR:', JSON.stringify({
        url: req.originalUrl,
        headers: req.headers,
        auth,
        body: req.body,
        failure,
        errorMessage: err?.message
    },null,4) );
}