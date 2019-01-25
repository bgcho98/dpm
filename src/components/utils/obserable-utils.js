import { Observable } from "rxjs";

const ObservableUtils = {
  fromPromise: function(promise) {
    return Observable.fromPromise(promise)
      .do(response => {
        if (response.data.header.isSuccessful == false) {
          throw response.data.header;
        }
      })
      .do(
        receivers => {},
        e => {
          this.catchException(e);
        }
      );
  },
  catchException: function(e) {
    alert(e);
    console.error(e);
    throw e;
  }
};

export default ObservableUtils;
