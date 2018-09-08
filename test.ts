import { interval, Subject, Observable } from "rxjs";
import { concatAll } from "rxjs/operators";
import { equals } from 'ramda';
import { division } from './division';
const oneTo100 = new Subject<Observable<number>>();
interval(100).pipe(
    division(
        (...values: any[]) => {
            if (equals([1, 2, 3, 4])(values)) {
                return true;
            }
            return false;
        },
        (...values: any[]) => {
            if (equals([99, 100, 101, 102])(values)) {
                return true;
            }
            return false;
        },
        oneTo100,
        // 截取长度
        4
    )
).subscribe(res => {
    console.log(res)
})

oneTo100.pipe(
    concatAll()
).subscribe(res => {
    console.log(`垃圾处理:${res}`)
});
