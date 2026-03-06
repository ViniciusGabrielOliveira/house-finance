import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FixedIncomes } from "./fixed-incomes";

describe("FixedIncomes", () => {
  let component: FixedIncomes;
  let fixture: ComponentFixture<FixedIncomes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixedIncomes],
    }).compileComponents();

    fixture = TestBed.createComponent(FixedIncomes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
