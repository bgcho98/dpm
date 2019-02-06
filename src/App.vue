<template>
  <div id="app">
    <div class="container-fluid" height="100%">
      <div>
        <b-card>
          <b-form-group label="수행월" :size="'sm'">
            <b-form-checkbox-group
              :size="'sm'"
              v-model="searchMontlyTag"
              name="flavour1"
              :options="tagMonthly"
            ></b-form-checkbox-group>
          </b-form-group>
          <b-form-group label="담당자" :size="'sm'">
            <b-form-checkbox-group
              :size="'sm'"
              v-model="searchMembers"
              name="flavour1"
              :options="members"
            ></b-form-checkbox-group>
          </b-form-group>

          <b-button :size="'sm'" :variant="'success'" @click="search">
            <font-awesome-icon :icon="['fas', 'search']"/>검색
          </b-button>
        </b-card>
      </div>
      <div>
        <b-card header="종합">
          <ul id="example-1">
            <li v-for="man in manMonthSum" :key="man.name">
              <a :href="`#${man.name}`">{{ man.name }}</a>
              : {{ (man.sum).toFixed(1) }} MD , 완료 {{ man.closedSum.toFixed(1) }}, 미완료 {{ (man.sum - man.closedSum).toFixed(1) }}
              <br>--- 모듈별 :
              <span
                v-for="module in man.statics.module"
                :key="module.name"
              >{{ module.name }} : {{ module.md.toFixed(1) }} ({{ (module.md*100/man.sum).toFixed(1) }}%),</span>
              <br>--- 종류별 :
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
          <span style="font-size:20px;">{{ man.name }}</span>
        </a>
        <span
          style="font-size:21px;"
        >&nbsp;: {{ (man.sum).toFixed(1) }} MD , 완료 {{ man.closedSum.toFixed(1) }}, 미완료 {{ (man.sum - man.closedSum).toFixed(1) }}</span>

        <vue-good-table
          :rows="man.posts"
          :columns="columns"
          styleClass="vgt-table condensed striped"
          :sort-options="{
            enabled: true,
            initialSortBy: {field: 'workflowClass', type: 'desc'}
          }"
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
              <b-badge
                :variant="getWorkflowColor(props.row.workflowClass)"
              >{{ props.row.workflowClass }}</b-badge>
            </template>
            <template v-else-if="props.column.field == 'month'">
              <b-form-select
                v-model="props.row.month"
                :options="tagMonthly"
                @change="changeWorkMonth($event, props.row)"
                size="sm"
              />
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
import Vue from "vue";

export default {
  components: {
    VueGoodTable,
    Gantt
  },
  created() {
    this.initTagMap();
    this.initMileStones();
  },
  data() {
    return {
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
            label: "Days",
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
        },
        {
          label: "수행월",
          field: "month",
          width: "100px",
          sortable: true
        }
      ],
      tagMap: [],
      tagMonthly: [],
      tagMD: [],
      manMonthSum: [],
      mileStoneMap: [],
      mileStoneArray: [],
      searchMontlyTag: [],
      searchMembers: [],
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
  methods: {
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
        .subscribe(group => this.manMonthSum.push(group));
    },
    validate() {
      if (this.searchMontlyTag.length < 1) {
        alert("조건을 선택하세요");
        throw "조건이 없음.";
      }
    },
    search() {
      this.validate();

      let tagIds = {
        tagIds: this.searchMontlyTag.join(","),
        tagOp: "or"
      };

      this.rows = [];
      if (this.searchMembers.length > 0) {
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
    getPostsAll(tagIds) {
      DoorayService.getPostsAll(tagIds)
        .mergeMap(contents => contents)
        .map(post => {
          post.assignUserName = this.getMemberName(post);
          post.summary = post.subject;
          this.extractTag(post);
          this.setScheduleDate(post);
          return post;
        })
        .toArray()
        .subscribe(contents => {
          this.rows = [...this.rows, ...contents];
        });
    },
    getMemberName(post) {
      let member = post.users.to[0].member;
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
      this.tagMonthly = [];
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
      if (tag.name.includes("수행월:")) {
        this.tagMonthly.push(
          Object.assign(tag, {
            text: tag.name.substring(4),
            value: tag.id
          })
        );
      }
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
        .subscribe(mileStone => {
          this.mileStoneMap[mileStone.id] = Object.assign(mileStone, {
            text: mileStone.name,
            value: mileStone.id
          });
          this.mileStoneArray.push(this.mileStoneMap[mileStone.id]);
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

        post.start_date = Vue.moment(endDate)
          .subtract(diff, "d")
          .format("YYYY-MM-DD 00:00");

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
        let end_date = this.$moment(post.start_date, this.dateFormat)
          .startOf("day")
          .add(diff, "d")
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
        let start_date = this.$moment(post.end_date, this.dateFormat)
          .endOf("day")
          .subtract(diff, "d")
          .startOf("day")
          .format(this.dateFormat);
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
      console.log(field);
    }
  }
};
</script>

<style>
html * {
  font-size: 12px;
}
</style>
