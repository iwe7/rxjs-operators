import {
    MonoTypeOperatorFunction, Observable,
    Operator, Subscriber, TeardownLogic, Observer, Subject
} from "rxjs";

export function division<T>(
    predicate: (value: T, index: number) => boolean,
    suffixdicate: (value: T, index: number) => boolean,
    observer: Observer<Observable<T>>,
    length: number = 1
): MonoTypeOperatorFunction<T> {
    return function divisionOperatorFunction(source: Observable<T>): Observable<T> {
        return source.lift(new DivisionOperator(predicate, suffixdicate, observer, length));
    }
}

class DivisionOperator<T> implements Operator<T, T> {
    constructor(
        private predicate: (value: T, index: number) => boolean,
        private suffixdicate: (value: T, index: number) => boolean,
        private observer: Observer<Observable<T>>,
        private length: number = 1
    ) { }

    call(subscriber: Subscriber<T>, source: any): TeardownLogic {
        return source.subscribe(new DivisionSubscriber(subscriber, this.predicate, this.suffixdicate, this.observer, this.length));
    }
}

class DivisionSubscriber<T> extends Subscriber<T> {
    count: number = 0;
    __isStart: boolean;
    __division: Subject<T>;
    _buffer: any[] = [];
    constructor(
        destination: Subscriber<T>,
        private predicate: (value: T, index: number) => boolean,
        private suffixdicate: (value: T, index: number) => boolean,
        private observer: Observer<Observable<T>>,
        private length: number = 1,
        private thisOrgs?: any
    ) {
        super(destination);
    }

    protected _next(value: T) {
        let predicate: boolean;
        let suffixdicate: boolean;
        try {
            this.count++;
            if (this._buffer.length < this.length) {
                // 如果长度不够 继续push
                this._buffer.push(value);
            } else {
                // 否则去掉第一个后push
                this._buffer.push(value);
                // 保存 前this.length个数据
                this._buffer = this._buffer.slice(this._buffer.length - this.length);
            }
            predicate = this.predicate.call(this.thisOrgs, ...this._buffer);
            suffixdicate = this.suffixdicate.call(this.thisOrgs, ...this._buffer);
        } catch (err) {
            this.destination.error(err);
            return;
        }
        // 前缀开始
        if (predicate) {
            this.__isStart = true;
            // 开启一个流
            this._createNewDivisionItem();
            this.__division.next(value);
            // 开始但没有结束
        } else if (this.__isStart && !suffixdicate) {
            this.__division.next(value);
            // 结束
        } else if (suffixdicate) {
            this.__isStart = false;
            this.__division.next(value);
            this.__division.complete();
        } else {
            this.destination.next(value);
        }
    }

    private _createNewDivisionItem(): void {
        this.__division = new Subject();
        // 这里没有直接返回this.__division是为了防止下游改变上游数据
        const divition = Observable.create((obser: Observer<T>) => {
            this.__division.subscribe(obser);
        });
        this.observer.next(divition);
    }
}
