import gulp from 'gulp';
import seed from './seed';
import addPushToken from './migrations/addPushToken'
import testPushNotification from './testPushNotification';

gulp.task('seed', seed);
gulp.task('addPushToken', addPushToken);
gulp.task('testPushNotification', testPushNotification);
