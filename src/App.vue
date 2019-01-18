<template>
  <div id="app">
    <button @click="search">search</button>
  </div>
</template>

<script>
import axios from "axios";

export default {
  methods: {
    search() {
      console.log("search");
      axios
        .get("/api/dooray/v2/wapi/projects/!1963480696738741170/posts", {
          params: {
            order: "-createdAt",
            page: '0',
            size: '30',
            tagIds: '2393296386705579586'
          }
        })
        .then(function(response) {
          console.log(response.data);
          console.log(response.status);
          console.log(response.statusText);
          console.log(response.headers);
          console.log(response.config);
        });
    }
  }
};
</script>
