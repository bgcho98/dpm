<template>
  <div id="app">
    <BlockUI v-if="isLoading" :url="pathGifLoading"/>
    <div class="container-fluid" height="100%">
      <b-form>
        <b-form-group>상위 업무 마일스톤으로 검색 :
          <b-form-checkbox-group
            :size="'sm'"
            v-model="searchParentMileStone"
            :options="filteredParentMileStone"
          ></b-form-checkbox-group>
        </b-form-group>
        <b-form-group>만기일 :
          <b-form-checkbox-group :size="'sm'" v-model="searchDueDate" :options="dueDateMonth"></b-form-checkbox-group>
        </b-form-group>
        <b-form-group>담당자 :
          <b-form-checkbox-group :size="'sm'" v-model="searchMembers" :options="members"></b-form-checkbox-group>
        </b-form-group>
        <b-form-group>
          <b-button :size="'sm'" :variant="'primary'" @click="search">
            <font-awesome-icon :icon="['fas', 'search']"/>검색
          </b-button>
        </b-form-group>
      </b-form>
      <div>
        <b-card header="종합">
          <ul id="example-1">
            <li v-for="man in manMonthSum" :key="man.name">
              <a :href="`#${man.name}`">{{ man.name }}</a>
              : {{ (man.sum).toFixed(1) }} MD , 완료 {{ man.closedSum.toFixed(1) }}, 미완료 {{ (man.sum - man.closedSum).toFixed(1) }}
              <br>모듈별 :
              <span
                v-for="module in man.statics.module"
                :key="module.name"
              >{{ module.name }} : {{ module.md.toFixed(1) }} ({{ (module.md*100/man.sum).toFixed(1) }}%),</span>
              <br>종류별 :
              <span
                v-for="workType in man.statics.workType"
                :key="workType.name"
              >{{ workType.name }} : {{ workType.md.toFixed(1) }} ({{ (workType.md*100/man.sum).toFixed(1) }}%),</span>
            </li>
          </ul>
        </b-card>
      </div>
      <hr>
      <gantt
        v-if="rows.length > 0"
        :items="rows"
        :fields="gantt.fields"
        :date-limit="gantt.dateLimit"
        @update="updateWokringDate"
        :title="'스케쥴 조정'"
      ></gantt>
      <hr>
      <div v-for="man in manMonthSum" :key="man.name">
        <a :name="man.name">
          <span style="font-size:20px !important;">{{ man.name }}</span>
        </a>
        <span
          style="font-size:21px  !important;;"
        >&nbsp;: {{ (man.sum).toFixed(1) }} MD , 완료 {{ man.closedSum.toFixed(1) }}, 미완료 {{ (man.sum - man.closedSum).toFixed(1) }}</span>

        <vue-good-table
          :rows="man.posts"
          :columns="columns"
          styleClass="vgt-table condensed striped"
          :sort-options="{
            enabled: true,
            initialSortBy: {field: 'workflowClass', type: 'desc'}
          }"
          :row-style-class="rowStyleClassFn"
        >
          <template slot="table-row" slot-scope="props">
            <template v-if="props.column.field == 'subject'">
              <a :href="getPostLink(props.row.id)" target="_blank">{{ props.row.subject }}</a>
            </template>
            <template v-else-if="props.column.field == 'parent.subject'">
              <a
                :href="getPostLink(props.row.parent.id)"
                target="_blank"
              >{{ props.row.parent.subject }}</a>
            </template>
            <template v-else-if="props.column.field == 'workflowClass'">
              <a :name="`${props.row.id}`">
                <b-badge
                  :variant="getWorkflowColor(props.row.workflowClass)"
                >{{ props.row.workflowClass }}</b-badge>
              </a>
            </template>
            <template v-else-if="props.column.field == 'mdTagId'">
              <b-form-select
                v-model="props.row.mdTagId"
                :options="tagMD"
                @change="changeMD($event, props.row)"
                size="sm"
              />
            </template>
            <template v-else-if="props.column.field == 'milestoneId'">
              <b-form-select
                v-model="props.row.milestoneId"
                :options="mileStoneArray"
                @change="changeMileStone($event, props.row)"
                size="sm"
              />
            </template>
            <template v-else>{{props.formattedRow[props.column.field]}}</template>
          </template>
        </vue-good-table>
      </div>
    </div>
  </div>
</template>

<script>
import DoorayService from "./components/service/dooray-service";
import { Observable } from "rxjs";
import { VueGoodTable } from "vue-good-table";
import Gantt from "./components/gantt/gantt.vue";
import pathGifLoading from "./assets/img/toast-console-loading.gif";
import { mapState, mapMutations } from "vuex";
import axios from "axios";

export default {
  components: {
    VueGoodTable,
    Gantt
  },
  created() {
    axios.interceptors.request.use(
      config => {
        this.startLoading();
        return config;
      },
      error => {
        this.endLoading();
        return Promise.reject(error);
      }
    );

    // Add a response interceptor
    axios.interceptors.response.use(
      response => {
        this.endLoading();
        return response;
      },
      error => {
        this.endLoading();
        return Promise.reject(error);
      }
    );
    this.initDueDateMonth();
    this.initTagMap();
    this.initMileStones();

    this.locationHash = window.location.hash;

    window.addEventListener("hashchange", () => {
      this.locationHash = window.location.hash;
      console.log(window.location.hash);
    });
  },
  data() {
    return {
      locationHash: "",
      pathGifLoading: pathGifLoading,
      gantt: {
        fields: {
          summary: {
            label: "제목",
            component: "gantt-text",
            width: 300,
            placeholder: "Add a new task...",
            editable: false
          },
          start_date: {
            label: "시작일",
            component: "gantt-date",
            width: 70,
            placeholder: "Start",
            sort: "date"
          },
          end_date: {
            label: "종료일",
            component: "gantt-date",
            width: 70
          },
          duration: {
            label: "MD",
            component: "gantt-number",
            width: 50,
            placeholder: "0",
            editable: false
          }
        },
        dateLimit: 30
      },
      rows: [],
      columns: [
        {
          label: "상태",
          field: "workflowClass",
          width: "80px",
          sortable: true
        },
        {
          label: "마일스톤",
          field: "milestoneId",
          width: "120px",
          sortable: true
        },
        {
          label: "상위 업무",
          field: "parent.subject",
          sortable: true,
          width: "200px"
        },
        {
          label: "제목",
          field: "subject",
          sortable: true
        },
        {
          label: "모듈",
          field: "module",
          width: "120px",
          sortable: true
        },
        {
          label: "종류",
          field: "workType",
          width: "80px",
          sortable: true
        },
        {
          label: "MD",
          field: "mdTagId",
          width: "70px",
          sortable: true
        }
      ],
      tagMap: [],
      tagMD: [],
      dueDateMonth: [],
      manMonthSum: [],
      mileStoneMap: [],
      mileStoneArray: [],
      searchDueDate: [],
      searchMembers: [],
      searchParentMileStone: [],
      members: [
        {
          text: "조병걸",
          value: "1945180349600930603"
        },
        {
          text: "신용우",
          value: "1419391681246072882"
        },
        {
          text: "김성훈",
          value: "1918363684021098528"
        },
        {
          text: "고민수",
          value: "1387695627788939264"
        },
        {
          text: "최강훈",
          value: "1387695623848592384"
        },
        {
          text: "김정빈",
          value: "2345839644051439504"
        },
        {
          text: "정기효",
          value: "1387695629192606464"
        },
        {
          text: "엄세진",
          value: "1390209123151787147"
        },
        {
          text: "이대화",
          value: "1595374919747279927"
        },
        {
          text: "심동호",
          value: "1853861261679058197"
        }
      ]
    };
  },
  watch: {
    rows() {
      this.calculate();
    }
  },
  computed: {
    ...mapState({
      isLoading: state => state.isLoading
    }),
    filteredParentMileStone() {
      return this.mileStoneArray
        .filter(
          mileStone =>
            mileStone.text.length == 7 && mileStone.text.charAt(4) == "."
        )
        .map(mileStone => {
          return {
            text: mileStone.text,
            value: mileStone.id
          };
        })
        .sort((a, b) => {
          return a.text.localeCompare(b.text);
        });
    }
  },
  methods: {
    ...mapMutations(["startLoading", "endLoading"]),
    setGroupMD(groupMap, groupArray, groupName, md) {
      if (groupMap[groupName] == undefined) {
        groupMap[groupName] = {
          name: groupName,
          md: 0
        };
        groupArray.push(groupMap[groupName]);
      }

      groupMap[groupName].md += md;
    },
    calculate() {
      this.manMonthSum = [];
      if (this.rows.length == 0) {
        return;
      }
      this.startLoading();
      Observable.from(this.rows)
        .groupBy(post => post.assignUserName)
        .mergeMap(group => {
          return group.reduce(
            (acc, cur) => {
              let closedMd = cur.workflowClass == "closed" ? cur.md : 0;

              this.setGroupMD(
                acc.statics.moduleMap,
                acc.statics.module,
                cur.module,
                cur.md
              );
              this.setGroupMD(
                acc.statics.workTypeMap,
                acc.statics.workType,
                cur.workType,
                cur.md
              );

              return {
                name: cur.assignUserName,
                sum: acc.sum + cur.md,
                closedSum: acc.closedSum + closedMd,
                posts: [...acc.posts, cur],
                statics: acc.statics
              };
            },
            {
              name: "",
              sum: 0,
              closedSum: 0,
              posts: [],
              statics: {
                moduleMap: [],
                module: [],
                workTypeMap: [],
                workType: []
              }
            }
          );
        })
        .subscribe(group => {
          this.manMonthSum.push(group);
          this.endLoading();
        });
    },
    validate() {
      if (this.searchDueDate.length < 1 && this.searchParentMileStone < 1) {
        alert("만기일이나 상위업무 마일스톤을 선택하세요");
        throw "조건이 없음.";
      }
    },
    search() {
      this.validate();

      let tagIds = {};

      if (this.searchDueDate.length > 0) {
        tagIds = Object.assign(tagIds, {
          dueAt: this.getSearchDueDate()
        });
      }

      this.rows = [];
      if (this.searchParentMileStone.length > 0) {
        this.getPostsAllByParent();
      } else if (this.searchMembers.length > 0) {
        for (var i = 0; i < this.searchMembers.length; i++) {
          Object.assign(tagIds, {
            toMemberIds: this.searchMembers[i]
          });
          this.getPostsAll(tagIds);
        }
      } else {
        this.getPostsAll(tagIds);
      }
    },
    getPostsAllByParent() {
      DoorayService.getPostsAll({
        milestoneIds: this.searchParentMileStone.join(","),
        milestoneOp: "or",
        hasParent: false
      })
        .mergeMap(contents => contents)
        .mergeMap(post => {
          return DoorayService.getSubPosts(post.number);
        })
        .mergeMap(contents => contents)
        .map(post => this.extractPost(post))
        .filter(post => this.fitlerSearchMember(post))
        .toArray()
        .subscribe({
          next: contents => {
            this.rows = [...this.rows, ...contents];
          },
          complete: () =>
            this.rows.sort(
              (left, right) =>
                this.$moment(left.start_date).unix() -
                this.$moment(right.start_date).unix()
            )
        });
    },
    fitlerSearchMember(post) {
      if (this.searchMembers.length == 0) {
        return true;
      }

      return this.searchMembers.includes(
        post.users.to[0].member.organizationMemberId
      );
    },
    extractPost(post) {
      post.assignUserName = this.getMemberName(post);
      post.summary = post.assignUserName + " " + post.subject;
      post.link = this.getPostLink(post.id);
      this.extractTag(post);
      this.setScheduleDate(post);
      return post;
    },
    getPostsAll(tagIds) {
      DoorayService.getPostsAll(tagIds)
        .mergeMap(contents => contents)
        .map(post => this.extractPost(post))
        .toArray()
        .subscribe({
          next: contents => {
            this.rows = [...this.rows, ...contents];
          },
          complete: () =>
            this.rows.sort(
              (left, right) =>
                this.$moment(left.start_date).unix() -
                this.$moment(right.start_date).unix()
            )
        });
    },
    getMemberName(post) {
      let member;
      if (post.users.to.length != 0) {
        member = post.users.to[0].member;
      }
      return member ? member.name : "미지정";
    },
    getMileStoneName(post) {
      let mileStone = this.mileStoneMap[post.milestoneId];
      return mileStone ? mileStone.name : "미지정";
    },
    extractTag(post) {
      post.tagList = [];
      for (var i = 0; i < post.tagIdList.length; i++) {
        var tagId = post.tagIdList[i];
        var tag = this.tagMap[tagId];

        if (tag == null) {
          continue;
        }

        post.tagList.push(tag);

        if (tag.name.includes("모듈")) {
          if (post.module == null) {
            post.module = tag.name.substring(4);
          }
        } else if (tag.name.includes("작업MD")) {
          post.md = Number(tag.name.substring(6));
          if (isNaN(post.md)) {
            post.md = 0;
          }
          post.mdTagId = tag.id;
        } else if (tag.name.includes("작업:")) {
          post.workType = tag.name.substring(4);
        } else if (tag.name.includes("수행월:")) {
          post.month = tag.id;
        }

        if (tag.module != null && tag.md != null) {
          return;
        }
      }

      if (post.module == null) {
        post.module = "미지정";
      }

      if (post.md == null) {
        post.md = 0;
      }
    },
    initTagMap() {
      this.tagMD = [];
      DoorayService.getTags()
        .mergeMap(tags => tags)
        .do(tag => this.putTagMap(tag))
        .subscribe(() => {
          this.tagMD.sort((prev, cur) => {
            return Number(prev.text) - Number(cur.text);
          });
        });
    },
    putTagMap(tag) {
      if (tag.name.includes("MD:")) {
        this.tagMD.push(
          Object.assign(tag, {
            text: tag.name.substring(6),
            value: tag.id
          })
        );
      }

      this.tagMap[tag.id] = tag;
    },
    initMileStones() {
      this.mileStoneMap = [];
      this.mileStoneArray = [];
      DoorayService.getMileStones()
        .mergeMap(mileStones => mileStones)
        .map(mileStone => {
          this.mileStoneMap[mileStone.id] = Object.assign(mileStone, {
            text: mileStone.name,
            value: mileStone.id
          });
          return this.mileStoneMap[mileStone.id];
        })
        .toArray()
        .subscribe(mileStones => {
          this.mileStoneArray = mileStones.sort((a, b) => {
            return b.name.localeCompare(a.name);
          });
        });
    },
    getPostLink(postId) {
      return `https://nhnent.dooray.com/popup/project/posts/${postId}`;
    },
    getWorkflowColor(workflowClass) {
      switch (workflowClass) {
        case "working":
          return "primary";
        case "registered":
          return "success";
        case "closed":
          return "dark";
      }
    },
    changeMD(newValue, row) {
      this.changeTag$(newValue, row, row.mdTagId).subscribe(() => {
        let post = this.rows.find(post => post.id === row.id);

        post.mdTagId = newValue;
        post.md = Number(this.tagMap[newValue].text);
        if (isNaN(post.md)) {
          post.md = 0;
          post.duration = post.md;
        }

        this.calculate();
      });
    },
    changeWorkMonth(newValue, row) {
      this.changeTag$(newValue, row, row.month).subscribe(() => {
        let post = this.rows.find(post => post.id === row.id);
        post.month = newValue;
      });
    },
    changeTag$(newValue, row, preId) {
      return DoorayService.modifyTags([row.id], [preId], [newValue]);
    },
    changeMileStone(newValue, row) {
      DoorayService.modifyMileStone([row.id], newValue).subscribe(() => {
        let post = this.rows.find(post => post.id === row.id);
        post.milestoneId = newValue;
      });
    },
    setScheduleDate(post) {
      if (post.dueDate) {
        let endDate = post.dueDate;
        let diff = post.md - 1;
        if (diff < 0) {
          diff = 0;
        }

        post.start_date = this.getStartDate(endDate, diff);
        post.end_date = endDate;
      } else {
        post.start_date = null;
        post.end_date = null;
      }
      post.duration = post.md;
    },
    updateWokringDate(post, field) {
      let diff = post.md - 1;
      if (diff < 0) {
        diff = 0;
      }

      let isUpdate = false;
      if (field === "start_date") {
        let end_date = this.$bMoment(post.start_date, this.dateFormat)
          .startOf("day")
          .businessAdd(diff)
          .endOf("day")
          .format(this.dateFormat);

        if (
          post.end_date === null ||
          this.$moment(end_date).isSame(post.end_date, "day") == false
        ) {
          post.end_date = end_date;
          isUpdate = true;
        }
      } else if (field === "end_date") {
        let start_date = this.getStartDate(post.end_date, diff);
        if (
          post.start_date === null ||
          this.$moment(start_date).isSame(post.start_date, "day") == false
        ) {
          post.start_date = start_date;
          isUpdate = true;
        }
      }

      if (isUpdate) {
        DoorayService.modifyDueDate(
          post.number,
          this.$moment(post.end_date).format()
        );
        post.dueDate = this.$moment(post.end_date).format();
      }
    },
    getStartDate(end_date, diff) {
      return this.$bMoment(end_date, this.dateFormat)
        .endOf("day")
        .businessSubtract(diff)
        .startOf("day")
        .format(this.dateFormat);
    },
    initDueDateMonth() {
      this.dueDateMonth = [];
      let months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

      months.forEach(month => {
        this.dueDateMonth.push({
          text: this.$moment()
            .months(month)
            .format("YYYY.MM"),
          value: month
        });
      });
    },
    getSearchDueDate() {
      this.searchDueDate.sort((left, right) => left - right);
      let start = this.$moment()
        .months(this.searchDueDate[0])
        .startOf("month")
        .format("YYYY-MM-DDT00:00:00+09:00");
      let end = this.$moment()
        .months(this.searchDueDate[this.searchDueDate.length - 1])
        .endOf("month")
        .format("YYYY-MM-DDT23:59:59+09:00");

      return `${start}~${end}`;
    },
    rowStyleClassFn(row) {
      console.log(this.locationHash);
      return `#${row.id}` === this.locationHash ? "green" : "white";
    }
  }
};
</script>

<style>
html * {
  font-size: 12px !important;
}

.card-body {
  padding: 0.3rem !important;
}

.col-form-label {
  padding-top: 0px !important;
  padding-bottom: 0px !important;
  text-align: right !important;
  font-weight: bold !important;
}

.form-control-sm {
  height: calc(1.1rem + 2px) !important;
  padding-top: 0px !important;
  padding-bottom: 0px !important;
  line-height: 2 !important;
}

.custom-select-sm {
  height: calc(1.1rem + 2px) !important;
  line-height: 1 !important;
}

.custom-control-label {
  vertical-align: bottom !important;
  display: inline-block;
}

.form-group {
  margin-bottom: 3px !important;
}

.card-header {
  padding: 3px !important;
}

.loading-container .loading-backdrop {
  opacity: 0.5 !important;
}
.loading-container .loading {
  width: 54px !important;
  height: 54px !important;
  left: 50% !important;
  line-height: 1 !important;
  padding: 0px 0px !important;
  border-radius: 0px !important;
}

.green {
  border: 2px solid goldenrod;
}
</style>
