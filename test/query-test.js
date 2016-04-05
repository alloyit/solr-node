/**
 * Created by godong on 2016. 3. 9..
 */

/**
 * Require modules
 */
var expect = require('chai').expect,
  Query = require('../lib/query');

describe('Query', function() {
  describe('#dismax', function() {
    it('should get dismax params.', function() {
      //given
      var testQuery = new Query();
      //when
      var query = testQuery.dismax();
      //then
      expect(query.params).to.eql([ 'defType=dismax' ]);
    });
  });

  describe('#edismax', function() {
    it('should get edismax params.', function() {
      //given
      var testQuery = new Query();
      //when
      var query = testQuery.edismax();
      //then
      expect(query.params).to.eql([ 'defType=edismax' ]);
    });
  });

  describe('#q', function() {
    it('should get query params when params is string.', function() {
      //given
      var testQuery = new Query();
      var params = 'text:test';
      //when
      var query = testQuery.q(params);
      //then
      expect(query.params).to.eql([ 'q=text%3Atest' ]);
    });

    it('should get query params when params is object.', function() {
      //given
      var testQuery = new Query();
      var params = {
        text: 'test',
        title: 'test'
      };
      //when
      var query = testQuery.q(params);
      //then
      expect(query.params).to.eql([ 'q=text:test%20AND%20title:test' ]);
    });
  });

  describe('#fl', function() {
    it('should get fl params when params is string.', function() {
      //given
      var testQuery = new Query();
      var params = 'text';
      //when
      var query = testQuery.fl(params);
      //then
      expect(query.params).to.eql([ 'fl=text' ]);
    });

    it('should get fl params when params is array.', function() {
      //given
      var testQuery = new Query();
      var params = ['text','title'];
      //when
      var query = testQuery.fl(params);
      //then
      expect(query.params).to.eql([ 'fl=text,title' ]);
    });
  });

  describe('#start', function() {
    it('should get start params when params is number.', function() {
      //given
      var testQuery = new Query();
      var params = 10;
      //when
      var query = testQuery.start(params);
      //then
      expect(query.params).to.eql([ 'start=10' ]);
    });
  });

  describe('#rows', function() {
    it('should get rows params when params is number.', function() {
      //given
      var testQuery = new Query();
      var params = 10;
      //when
      var query = testQuery.rows(params);
      //then
      expect(query.params).to.eql([ 'rows=10' ]);
    });
  });

  describe('#sort', function() {
    it('should get sort params when params is object.', function() {
      //given
      var testQuery = new Query();
      var params = {score:'desc', like:'desc'};
      //when
      var query = testQuery.sort(params);
      //then
      expect(query.params).to.eql([ 'sort=score desc,like desc' ]);
    });
  });

  describe('#fq', function() {
    it('should get fq params when params is object.', function() {
      //given
      var testQuery = new Query();
      var params = {field: 'loc', value: "IsWithin(POLYGON((129.3100483 34.9835815,129.3100483 35.3874414,128.787197 35.3874414,128.787197 34.9835815,129.3100483 34.9835815))) distErrPct=0"};
      //when
      var query = testQuery.fq(params);
      //then
      expect(query.params).to.eql([ "fq=loc:IsWithin(POLYGON((129.3100483 34.9835815,129.3100483 35.3874414,128.787197 35.3874414,128.787197 34.9835815,129.3100483 34.9835815))) distErrPct=0" ]);
    });

    it('should get fq params when params is object.', function() {
      //given
      var testQuery = new Query();
      var params = [{field:'like', value:10}, {field:'hate', value:10}];
      //when
      var query = testQuery.fq(params);
      //then
      expect(query.params).to.eql([ 'fq=like:10', 'fq=hate:10' ]);
    });
  });

  describe('#df', function() {
    it('should get df params when params is string.', function() {
      //given
      var testQuery = new Query();
      var params = 'title';
      //when
      var query = testQuery.df(params);
      //then
      expect(query.params).to.eql([ 'df=title' ]);
    });
  });

  describe('#termsQuery', function() {
    it('should get terms params when params not string and object.', function() {
      //given
      var testQuery = new Query();
      var params = null;
      //when
      var query = testQuery.termsQuery(params);
      //then
      expect(query.params).to.eql([]);
    });

    it('should get terms params when params is string.', function() {
      //given
      var testQuery = new Query();
      var params = 'terms=true&terms.fl=text';
      //when
      var query = testQuery.termsQuery(params);
      //then
      expect(query.params).to.eql([
        "terms=true&terms.fl=text"
      ]);
    });

    it('should get terms params when params is object(on:false).', function() {
      //given
      var testQuery = new Query();
      var params = {
        on: false
      };
      //when
      var query = testQuery.termsQuery(params);
      //then
      expect(query.params).to.eql([
        "terms=false"
      ]);
    });

    it('should get terms params when params is object.', function() {
      //given
      var testQuery = new Query();
      var params = {
        fl: 'text',
        prefix: 'te'
      };
      //when
      var query = testQuery.termsQuery(params);
      //then
      expect(query.params).to.eql([
        "terms=true",
        "terms.fl=text",
        "terms.prefix=te"
      ]);
    });

    it('should get terms params when params is object of other params.', function() {
      //given
      var testQuery = new Query();
      var params = {
        fl: 'text',
        lower: 'te',
        lowerIncl: true,
        mincount: 1,
        maxcount: 100
      };
      //when
      var query = testQuery.termsQuery(params);
      //then
      expect(query.params).to.eql([
        'terms=true',
        'terms.fl=text',
        'terms.lower=te',
        'terms.lower.incl=true',
        'terms.mincount=1',
        'terms.maxcount=100'
      ]);
    });

    it('should get terms params when params is object of other params2.', function() {
      //given
      var testQuery = new Query();
      var params = {
        fl: 'text',
        regex: '[test]',
        regexFlag: 'literal',
        limit: 10,
        upper: 'te',
        upperIncl: true,
        raw: true,
        sort: 'index'
      };
      //when
      var query = testQuery.termsQuery(params);
      //then
      expect(query.params).to.eql([
        'terms=true',
        'terms.fl=text',
        'terms.regex=[test]',
        'terms.regexFlag=literal',
        'terms.limit=10',
        'terms.upper=te',
        'terms.upper.incl=true',
        'terms.raw=true',
        'terms.sort=index'
      ]);
    });
  });

  describe('#mltQuery', function() {
    it('should get mlt params when params not string and object.', function() {
      //given
      var testQuery = new Query();
      var params = null;
      //when
      var query = testQuery.mltQuery(params);
      //then
      expect(query.params).to.eql([]);
    });

    it('should get mlt params when params is string.', function() {
      //given
      var testQuery = new Query();
      var params = 'q=title:test&mlt.fl=title,text&mlt.mindf=1&mlt.mintf=1';
      //when
      var query = testQuery.mltQuery(params);
      //then
      expect(query.params).to.eql([
        'q=title:test&mlt.fl=title,text&mlt.mindf=1&mlt.mintf=1'
      ]);
    });

    it('should get mlt params when params is object(on:false).', function() {
      //given
      var testQuery = new Query();
      var params = {
        on: false
      };
      //when
      var query = testQuery.mltQuery(params);
      //then
      expect(query.params).to.eql([
        "mlt=false"
      ]);
    });

    it('should get mlt params when params not string and object.', function() {
      //given
      var testQuery = new Query();
      var params = {
        fl: ['title', 'text'],
        mindf: 1,
        mintf: 1
      };
      //when
      var query =
        testQuery
          .q({title:'test'})
          .mltQuery(params);
      //then
      expect(query.params).to.eql([
        'q=title:test',
        'mlt=true',
        'mlt.fl=title,text',
        'mlt.mintf=1',
        'mlt.mindf=1'
      ]);
    });

    it('should get mlt params when params is other params.', function() {
      //given
      var testQuery = new Query();
      var params = {
        fl: 'title',
        maxdf: 1,
        minwl: 3,
        maxwl: 7,
        maxqt: 3,
        maxntp: 2,
        count: 10,
        matchInclude: true,
        matchOffset: 5,
        interestingTerms: 'detail'
      };
      //when
      var query =
        testQuery
          .q({title:'test'})
          .mltQuery(params);
      //then
      expect(query.params).to.eql([
        'q=title:test',
        'mlt=true',
        'mlt.fl=title',
        'mlt.maxdf=1',
        'mlt.minwl=3',
        'mlt.maxwl=7',
        'mlt.maxqt=3',
        'mlt.maxntp=2',
        'mlt.count=10',
        'mlt.match.include=true',
        'mlt.match.offset=5',
        'mlt.interestingTerms=detail'
      ]);
    });

    it('should get mlt params when params is other params2.', function() {
      //given
      var testQuery = new Query();
      var params = {
        boost: false,
        qf: 'title'
      };
      //when
      var query =
        testQuery
          .q('test')
          .mltQuery(params);
      //then
      expect(query.params).to.eql([
        'q=test',
        'mlt=true',
        'mlt.boost=false',
        'mlt.qf=title'
      ]);
    });
  });

  describe('#spellcheckQuery', function() {
    it('should get spellcheck params when params not string and object.', function() {
      //given
      var testQuery = new Query();
      var params = null;
      //when
      var query = testQuery.spellcheckQuery(params);
      //then
      expect(query.params).to.eql([]);
    });

    it('should get spellcheck params when params is string.', function() {
      //given
      var testQuery = new Query();
      var params = 'df=text&q=test&spellcheck=true&spellcheck.collateParam.q.op=AND';
      //when
      var query = testQuery.spellcheckQuery(params);
      //then
      expect(query.params).to.eql([
        'df=text&q=test&spellcheck=true&spellcheck.collateParam.q.op=AND'
      ]);
    });

    it('should get spellcheck params when params is object(on:false).', function() {
      //given
      var testQuery = new Query();
      var params = {
        on: false
      };
      //when
      var query = testQuery.spellcheckQuery(params);
      //then
      expect(query.params).to.eql([
        "spellcheck=false"
      ]);
    });

    it('should get spellcheck params when params is object.', function() {
      //given
      var testQuery = new Query();
      var params = {
        on: true,
        q: 'tes',
        accuracy: 0.5,
        maxCollations: 5,
        count: 10
      };
      //when
      var query =
        testQuery
          .df('title')
          .spellcheckQuery(params);
      //then
      expect(query.params).to.eql([
        'df=title',
        'spellcheck=true',
        'spellcheck.q=tes',
        'spellcheck.maxCollations=5',
        'spellcheck.count=10',
        'spellcheck.accuracy=0.5'
      ]);
    });

    it('should get spellcheck params when params is other params.', function() {
      //given
      var testQuery = new Query();
      var params = {
        build: true,
        collate: true,
        maxCollations: 5,
        maxCollationTries: 3,
        maxCollationEvaluations: 2,
        collateExtendedResults: true,
        collateMaxCollectDocs: 5,
        dictionary: "defaule",
        extendedResults: true,
        onlyMorePopular: true,
        maxResultsForSuggest: 5,
        alternativeTermCount: 3,
        reload: true,
        accuracy: 1.0
      };
      //when
      var query =
        testQuery
          .q({title:'test'})
          .spellcheckQuery(params);
      //then
      expect(query.params).to.eql([
        'q=title:test',
        'spellcheck=true',
        'spellcheck.build=true',
        'spellcheck.collate=true',
        'spellcheck.maxCollations=5',
        'spellcheck.maxCollationTries=3',
        'spellcheck.maxCollationEvaluations=2',
        'spellcheck.collateExtendedResults=true',
        'spellcheck.collateMaxCollectDocs=5',
        'spellcheck.dictionary=defaule',
        'spellcheck.extendedResults=true',
        'spellcheck.onlyMorePopular=true',
        'spellcheck.maxResultsForSuggest=5',
        'spellcheck.alternativeTermCount=3',
        'spellcheck.reload=true',
        'spellcheck.accuracy=1'
      ]);
    });
  });

  describe('#facetQuery', function() {
    it('should get facet params when params not string and object.', function() {
      //given
      var testQuery = new Query();
      var params = null;
      //when
      var query = testQuery.facetQuery(params);
      //then
      expect(query.params).to.eql([]);
    });

    it('should get facet params when params is string.', function() {
      //given
      var testQuery = new Query();
      var params = 'q=test&rows=0&facet=true&facet.limit=-1&facet.field=title&facet.field=subTitle';
      //when
      var query = testQuery.facetQuery(params);
      //then
      expect(query.params).to.eql([
        'q=test&rows=0&facet=true&facet.limit=-1&facet.field=title&facet.field=subTitle'
      ]);
    });

    it('should get facet params when params is object(on:false).', function() {
      //given
      var testQuery = new Query();
      var params = {
        on: false
      };
      //when
      var query = testQuery.facetQuery(params);
      //then
      expect(query.params).to.eql([
        "facet=false"
      ]);
    });

    it('should get facet params when params is object.', function() {
      //given
      var testQuery = new Query();
      var params = {
        on: true,
        query: 'test',
        field: 'title',
        prefix: 'test',
        contains:'tes',
        containsIgnoreCase: 'not',
        sort: 'count',
        limit: 10,
        offset: 10,
        mincount: 1
      };
      //when
      var query = testQuery.facetQuery(params);
      //then
      expect(query.params).to.eql([
        'facet=true',
        'facet.query=test',
        'facet.field=title',
        'facet.prefix=test',
        'facet.contains=tes',
        'facet.contains.ignoreCase=not',
        'facet.sort=count',
        'facet.limit=10',
        'facet.offset=10',
        'facet.mincount=1'
      ]);
    });

    it('should get facet params when other params is object.', function() {
      //given
      var testQuery = new Query();
      var params = {
        query: 'test',
        field: ['title','text'],
        missing: true,
        method: 'enum'
      };
      //when
      var query = testQuery.facetQuery(params);
      //then
      expect(query.params).to.eql([
        'facet=true',
        'facet.query=test',
        'facet.field=title,text',
        'facet.missing=true',
        'facet.method=enum'
      ]);
    });
  });

  describe('#groupQuery', function() {
    it('should get group params when params not string and object.', function() {
      //given
      var testQuery = new Query();
      var params = null;
      //when
      var query = testQuery.groupQuery(params);
      //then
      expect(query.params).to.eql([]);
    });

    it('should get group params when params is string.', function() {
      //given
      var testQuery = new Query();
      var params = 'q=test&rows=0&group=true&group.field=title';
      //when
      var query = testQuery.groupQuery(params);
      //then
      expect(query.params).to.eql([
        'q=test&rows=0&group=true&group.field=title'
      ]);
    });

    it('should get group params when params is object(on:false).', function() {
      //given
      var testQuery = new Query();
      var params = {
        on: false
      };
      //when
      var query = testQuery.groupQuery(params);
      //then
      expect(query.params).to.eql([
        "group=false"
      ]);
    });

    it('should get group params when on:true, query:test, ... , format:simple.', function() {
      //given
      var testQuery = new Query();
      var params = {
        on: true,
        field: 'title',
        query: 'test',
        limit: 10,
        offset: 0,
        sort: 'score desc',
        format: 'simple'
      };
      //when
      var query = testQuery.groupQuery(params);
      //then
      expect(query.params).to.eql([
        'group=true',
        'group.field=title',
        'group.query=test',
        'group.limit=10',
        'group.offset=0',
        'group.sort=score desc',
        'group.format=simple'
      ]);
    });

    it('should get group params when field:title, main:true, ... , cachePercent:20.', function() {
      //given
      var testQuery = new Query();
      var params = {
        field: 'title',
        main: true,
        format: 'simple',
        ngroups: true,
        truncate: true,
        cachePercent: 20
      };
      //when
      var query = testQuery.groupQuery(params);
      //then
      expect(query.params).to.eql([
        'group=true',
        'group.field=title',
        'group.format=simple',
        'group.main=true',
        'group.ngroups=true',
        'group.truncate=true',
        'group.cache.percent=20'
      ]);
    });

    it('should get group params when field:title, facet:true.', function() {
      //given
      var testQuery = new Query();
      var params = {
        field: 'title',
        facet: true
      };
      //when
      var query = testQuery.groupQuery(params);
      //then
      expect(query.params).to.eql([
        'group=true',
        'group.field=title',
        'group.facet=true'
      ]);
    });
  });

  describe('#hlQuery', function() {
    it('should get hl params when params not string and object.', function() {
      //given
      var testQuery = new Query();
      var params = null;
      //when
      var query = testQuery.hlQuery(params);
      //then
      expect(query.params).to.eql([]);
    });

    it('should get hl params when params is string.', function() {
      //given
      var testQuery = new Query();
      var params = 'q=title:test&hl=true&hl.fl=title';
      //when
      var query = testQuery.hlQuery(params);
      //then
      expect(query.params).to.eql([
        'q=title:test&hl=true&hl.fl=title'
      ]);
    });

    it('should get hl params when params is object(on:false).', function() {
      //given
      var testQuery = new Query();
      var params = {
        on: false
      };
      //when
      var query = testQuery.hlQuery(params);
      //then
      expect(query.params).to.eql([
        "hl=false"
      ]);
    });

    it('should get group params when on:true, q:title:text, ... , snippets:1.', function() {
      //given
      var testQuery = new Query();
      var params = {
        on: true,
        q: 'title:text',
        qparser: 'defType',
        fl: ['title', 'content'],
        snippets: 1
      };
      //when
      var query = testQuery.hlQuery(params);
      //then
      expect(query.params).to.eql([
        'hl=true',
        'hl.q=title:text',
        'hl.qparser=defType',
        'hl.fl=title,content',
        'hl.snippets=1'
      ]);
    });

    it('should get group params when q:title:text, fl:title ... , fragmenter:gap.', function() {
      //given
      var testQuery = new Query();
      var params = {
        q: 'title:text',
        fl: 'title',
        fragsize: 100,
        mergeContiguous: false,
        requireFieldMatch: false,
        maxAnalyzedChars: 10000,
        maxMultiValuedToExamine: 10000,
        maxMultiValuedToMatch: 10000,
        alternateField: 'content',
        maxAlternateFieldLength: 10000,
        formatter: 'simple',
        simplePre: '<em>',
        simplePost: '</em>',
        fragmenter: 'gap'
      };
      //when
      var query = testQuery.hlQuery(params);
      //then
      expect(query.params).to.eql([
        'hl=true',
        'hl.q=title:text',
        'hl.fl=title',
        'hl.fragsize=100',
        'hl.mergeContiguous=false',
        'hl.requireFieldMatch=false',
        'hl.maxAnalyzedChars=10000',
        'hl.maxMultiValuedToExamine=10000',
        'hl.maxMultiValuedToMatch=10000',
        'hl.alternateField=content',
        'hl.maxAlternateFieldLength=10000',
        'hl.formatter=simple',
        'hl.simple.pre=<em>',
        'hl.simple.post=</em>',
        'hl.fragmenter=gap'
      ]);
    });

    it('should get group params when q:title:text, fl:title, ... , preserveMulti:false.', function() {
      //given
      var testQuery = new Query();
      var params = {
        q: 'title:text',
        fl: 'title',
        usePhraseHighlighter: true,
        highlightMultiTerm: true,
        regexSlop: 0.6,
        regexPattern: /[0-9]/,
        regexMaxAnalyzedChars: 1000,
        preserveMulti: false
      };
      //when
      var query = testQuery.hlQuery(params);
      //then
      expect(query.params).to.eql([
        'hl=true',
        'hl.q=title:text',
        'hl.fl=title',
        'hl.usePhraseHighlighter=true',
        'hl.highlightMultiTerm=true',
        'hl.regex.slop=0.6',
        'hl.regex.pattern=/[0-9]/',
        'hl.regex.maxAnalyzedChars=1000',
        'hl.preserveMulti=false'
      ]);
    });
  });

});
