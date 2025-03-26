export function isValidEmail(val:string) {
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(val) || 'Invalid email !'
}

export function isRequired(val: any) {
    return !!val
}

export function ifRequired(srcVal:any, val:any) {
    if(srcVal) {
        return isRequired(val)
    }
    return true
}