<template>
  <div id="app">
    <div
      class="container-fluid"
      height="100%"
    >
      <div>
        <b-card>
          <b-form-group
            label="수행월"
            :size="'sm'"
          >
            <b-form-checkbox-group
              :size="'sm'"
              v-model="searchMontlyTag"
              name="flavour1"
              :options="tagMonthly"
            ></b-form-checkbox-group>
          </b-form-group>
          <b-form-group
            label="담당자"
            :size="'sm'"
          >
            <b-form-checkbox-group
              :size="'sm'"
              v-model="searchMembers"
              name="flavour1"
              :options="members"
            ></b-form-checkbox-group>
          </b-form-group>

          <b-button
            :size="'sm'"
            :variant="'success'"
            @click="search"
          >
            <font-awesome-icon icon="search" />검색
          </b-button>
        </b-card>
      </div>
      <div>
        <b-card header="종합">
          <ul id="example-1">
            <li
              v-for="man in manMonthSum"
              :key="man.name"
            >
              <a :href="`#${man.name}`">{{ man.name }}</a>
              : {{ (man.sum).toFixed(1) }} MD , 완료 {{ man.closedSum.toFixed(1) }}, 미완료 {{ (man.sum - man.closedSum).toFixed(1) }}
              <br>
              --- 모듈별 : <span
                v-for="module in man.statics.module"
                :key="module.name"
              >{{ module.name }} : {{ module.md.toFixed(1) }} ({{ (module.md*100/man.sum).toFixed(1) }}%), </span>
              <br>
              --- 종류별 : <span
                v-for="workType in man.statics.workType"
                :key="workType.name"
              >{{ workType.name }} : {{ workType.md.toFixed(1) }} ({{ (workType.md*100/man.sum).toFixed(1) }}%), </span>
            </li>
          </ul>
        </b-card>
      </div>
      <hr>
      <div
        v-for="man in manMonthSum"
        :key="man.name"
      >
        <h3>
          <a :name="man.name">{{ man.name }}</a>
          : {{ (man.sum).toFixed(1) }} MD , 완료 {{ man.closedSum.toFixed(1) }}, 미완료 {{ (man.sum - man.closedSum).toFixed(1) }}
        </h3>
        <b-table
          striped
          hover
          small
          :items="man.posts"
          :fields="columns"
        >
          <template
            slot="parentSubject"
            slot-scope="data"
          >
            <a
              :href="getPostLink(data.item.parent.id)"
              target="_blank"
            >{{ data.value }}</a>
          </template>
          <template
            slot="subject"
            slot-scope="data"
          >
            <a
              :href="getPostLink(data.item.id)"
              target="_blank"
            >{{ data.item.number }} {{ data.value }}</a>
          </template>
          <template
            slot="workflowClass"
            slot-scope="data"
          >
            <b-badge :variant="getWorkflowColor(data.value)">{{ data.value }}</b-badge>
          </template>
          <template
            slot="month"
            slot-scope="data"
          >
            <b-form-select
              v-model="data.value"
              :options="tagMonthly"
              @change="changeWorkMonth($event, data)"
              size="sm"
            />
          </template>
          <template
            slot="md"
            slot-scope="data"
          >
            <b-form-select
              v-model="data.item.mdTagId"
              :options="tagMD"
              @change="changeMD($event, data)"
              size="sm"
            />
          </template>
          <template
            slot="milestoneId"
            slot-scope="data"
          >
            <b-form-select
              v-model="data.value"
              :options="mileStoneArray"
              @change="changeMileStone($event, data)"
              size="sm"
            />
          </template>
        </b-table>
        <hr>
      </div>
    </div>
  </div>
</template>

<script>
import "tui-grid/dist/tui-grid.css";
import DoorayService from "./components/service/dooray-service";
import { Observable } from "rxjs";

export default {
  created() {
    this.initTagMap();
    this.initMileStones();
  },
  data() {
    return {
      rows: [],
      columns: [
        {
          label: "상태",
          key: "workflowClass",
          width: "100px",
          sortable: true
        },
        {
          label: "마일스톤",
          key: "milestoneId",
          width: "100px",
          sortable: true
        },
        {
          label: "상위 업무",
          key: "parentSubject",
          sortable: true,
          width: "200px"
        },
        {
          label: "제목",
          key: "subject",
          sortable: true
        },
        {
          label: "모듈",
          key: "module",
          width: "140px",
          sortable: true
        },
        {
          label: "종류",
          key: "workType",
          width: "100px",
          sortable: true
        },
        {
          label: "MD",
          key: "md",
          width: "30px",
          sortable: true
        },
        {
          label: "수행월",
          key: "month",
          width: "30px",
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
        .groupBy(issue => issue.assignUserName)
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
        .map(content => {
          Object.assign(content, {
            assignUserName: this.getMemberName(content),
            mileStoneName: this.getMileStoneName(content),
            parentSubject: content.parent.subject
          });
          this.extractTag(content);
          return content;
        })
        .toArray()
        .subscribe(contents => {
          this.rows = [...this.rows, ...contents];
        });
    },
    getMemberName(issue) {
      let member = issue.users.to[0].member;
      return member ? member.name : "미지정";
    },
    getMileStoneName(issue) {
      let mileStone = this.mileStoneMap[issue.milestoneId];
      return mileStone ? mileStone.name : "미지정";
    },
    extractTag(issue) {
      issue.tagList = [];
      for (var i = 0; i < issue.tagIdList.length; i++) {
        var tagId = issue.tagIdList[i];
        var tag = this.tagMap[tagId];

        if (tag == null) {
          continue;
        }

        issue.tagList.push(tag);

        if (tag.name.includes("모듈")) {
          if (issue.module == null) {
            issue.module = tag.name.substring(4);
          }
        } else if (tag.name.includes("작업MD")) {
          issue.md = Number(tag.name.substring(6));
          if (isNaN(issue.md)) {
            issue.md = 0;
          }
          issue.mdTagId = tag.id;
        } else if (tag.name.includes("작업:")) {
          issue.workType = tag.name.substring(4);
        } else if (tag.name.includes("수행월:")) {
          issue.month = tag.id;
        }

        if (tag.module != null && tag.md != null) {
          return;
        }
      }

      if (issue.module == null) {
        issue.module = "미지정";
      }

      if (issue.md == null) {
        issue.md = 0;
      }
    },
    initTagMap() {
      this.tagMonthly = [];
      DoorayService.getTags()
        .mergeMap(tags => tags)
        .subscribe(tag => {
          this.putTagMap(tag);
        });
    },
    putTagMap(tag) {
      if (tag.name.includes("수행월:")) {
        this.tagMonthly.push(
          Object.assign(tag, {
            text: tag.name,
            value: tag.id
          })
        );
      }
      if (tag.name.includes("MD:")) {
        this.tagMD.push(
          Object.assign(tag, {
            text: tag.name,
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
    changeMD(newValue, data) {
      this.changeTag$(newValue, data, data.item.mdTagId).subscribe(() => {
        data.item.md = Number(this.tagMap[newValue].text.substring(6));
        if (isNaN(data.item.md)) {
          data.item.md = 0;
        }
        this.calculate();
      });
    },
    changeWorkMonth(newValue, data) {
      this.changeTag$(newValue, data, data.item.month).subscribe(() => {});
    },
    changeTag$(newValue, data, preId) {
      return DoorayService.modifyTags([data.item.id], [preId], [newValue]);
    },
    changeMileStone(newValue, data) {
      DoorayService.modifyMileStone([data.item.id], newValue).subscribe(
        () => {}
      );
    }
  }
};
</script>

<style>
html * {
  font-size: 98%;
}
</style>
